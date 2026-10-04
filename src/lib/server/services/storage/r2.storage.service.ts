import {
  CLOUDFLARE_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
} from "$app/env/private";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { DOCUMENT } from "#lib/const/document.const.js";
import { ERROR } from "#lib/const/error.const.js";
import { Dates } from "#lib/utils/dates.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
  type CompleteMultipartUploadCommandOutput,
  type PutObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { captureException } from "@sentry/sveltekit";
import { Readable } from "node:stream";
import type { z } from "zod";

const log = Log.child({ service: "R2" });

// `null` when the opt-in storage kit is not configured.
const r2 =
  CLOUDFLARE_ACCOUNT_ID &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_BUCKET_NAME
    ? {
        bucket: R2_BUCKET_NAME,
        client: new S3Client({
          region: "auto",
          endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
          },
        }),
      }
    : null;

const not_configured = () =>
  result.err({
    ...ERROR.INTERNAL_SERVER_ERROR,
    message: "File storage is not configured",
  });

type BlobPayloadInputTypes =
  | string
  | Uint8Array
  | Buffer
  | Readable
  | ReadableStream<Uint8Array>;

const is_stream = (
  body: BlobPayloadInputTypes,
): body is Readable | ReadableStream<Uint8Array> =>
  body instanceof Readable || body instanceof ReadableStream;

const put = async (input: {
  key: string;
  content_length?: number;
  body: BlobPayloadInputTypes;
  content_type: z.core.util.MimeTypes;

  /** Stored as `x-amz-meta-*`, and read back by `R2Service.head`. */
  metadata?: Record<string, string>;

  /**
   * Milliseconds until the HTTP `Expires` header, which tells caches when to
   * revalidate. It does NOT delete the object: R2 keeps it until a bucket
   * lifecycle rule (configured on the bucket, not here) removes it.
   */
  http_expires_in?: number;
}): Promise<
  App.Result<PutObjectCommandOutput | CompleteMultipartUploadCommandOutput>
> => {
  if (!r2) return not_configured();

  try {
    const params = {
      Key: input.key,
      Bucket: r2.bucket,
      ContentType: input.content_type,
      Metadata: input.metadata,

      Expires: input.http_expires_in
        ? Dates.add_ms(input.http_expires_in)
        : undefined,
    };

    if (is_stream(input.body)) {
      // `Upload`, never `PutObjectCommand`: the SDK throws on a stream without
      // a `Content-Length`, which a proxied or chunked download (a `fetch`
      // body) usually has none of. `Upload` goes multipart past 5MB, so the
      // body is never buffered whole. `content_length` is not forwarded — on
      // `CreateMultipartUpload` it would describe a part, not the object.
      const upload = new Upload({
        client: r2.client,
        params: { ...params, Body: input.body },
      });

      const res = await upload.done();

      log.debug(res, "put.res streamed");

      return result.suc(res);
    }

    const res = await r2.client.send(
      new PutObjectCommand({
        ...params,
        Body: input.body,
        ContentLength: input.content_length,
      }),
    );

    log.debug(res, "put.res");

    return result.suc(res);
  } catch (error) {
    return ServiceUtil.internal(error, { log, scope: "put" });
  }
};

export const R2Service = {
  put,

  /**
   * Upload a file to R2 storage
   */
  async put_file(input: {
    key: string;
    file: File;
  }): Promise<
    App.Result<PutObjectCommandOutput | CompleteMultipartUploadCommandOutput>
  > {
    try {
      const buffer = await input.file.arrayBuffer();
      const body = new Uint8Array(buffer);

      const res = await put({
        body,
        key: input.key,
        content_type: input.file.type,
        content_length: input.file.size,
      });

      return res;
    } catch (error) {
      return ServiceUtil.internal(error, { log, scope: "put_file" });
    }
  },

  /**
   * Delete a file from R2 storage
   * @param key - R2 key path to delete
   * @returns Result<void>
   */
  async delete(key: string): Promise<App.Result<void>> {
    if (!r2) return not_configured();

    try {
      const delete_res = await r2.client.send(
        new DeleteObjectCommand({
          Key: key,
          Bucket: r2.bucket,
        }),
      );

      log.debug(delete_res, "delete.delete_res");

      return result.suc(undefined);
    } catch (error) {
      return ServiceUtil.internal(error, { log, scope: "delete" });
    }
  },

  /**
   * Whether an object exists, without downloading it. A miss is
   * `exists: false`, not an error — only an unreachable bucket fails, so it
   * cannot pass for an empty one. `metadata` may be absent on objects written
   * without it, so readers need a default.
   */
  async head(key: string): Promise<
    App.Result<{
      exists: boolean;
      size: number | null;
      metadata: Record<string, string> | undefined;
    }>
  > {
    if (!r2) return not_configured();

    try {
      const res = await r2.client.send(
        new HeadObjectCommand({ Key: key, Bucket: r2.bucket }),
      );

      return result.suc({
        exists: true,
        size: res.ContentLength ?? null,
        metadata: res.Metadata,
      });
    } catch (error) {
      // The miss arrives as a typed error or a bare 404, by SDK version and
      // endpoint: HEAD has no body for the SDK to read an error code from.
      if (
        error instanceof NotFound ||
        error instanceof NoSuchKey ||
        (typeof error === "object" &&
          error !== null &&
          "$metadata" in error &&
          (error.$metadata as { httpStatusCode?: number } | undefined)
            ?.httpStatusCode === 404)
      ) {
        return result.suc({ exists: false, size: null, metadata: undefined });
      }

      return ServiceUtil.internal(error, {
        log,
        scope: "head",
        extra: { key },
      });
    }
  },

  /**
   * Fetch a file from R2 as a buffer (for email attachments)
   * @param key - R2 key path
   * @returns Result with buffer, content_type, and size
   */
  async get(
    key: string,
  ): Promise<
    App.Result<{ buffer: Uint8Array; content_type: string; size: number }>
  > {
    if (!r2) return not_configured();

    try {
      const response = await r2.client.send(
        new GetObjectCommand({
          Key: key,
          Bucket: r2.bucket,
        }),
      );

      if (!response.Body) return result.err(ERROR.NOT_FOUND);

      // Convert stream to Uint8Array using AWS SDK utility
      const buffer = await response.Body.transformToByteArray();

      return result.suc({
        buffer,
        size: response.ContentLength || buffer.length,
        content_type: response.ContentType || "application/octet-stream",
      });
    } catch (error) {
      log.debug(error, "get.error");

      // Check for NoSuchKey error (404)
      if (error instanceof NoSuchKey) {
        return result.err(ERROR.NOT_FOUND);
      }

      log.error(error, "get_file_buffer.error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  },

  /**
   * Generate a presigned download URL for a file
   * @param key - R2 key path
   * @param expires_in - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns Result<string> - Presigned URL
   */
  async get_signed_url(
    key: string,
    expires_in: number = DOCUMENT.LIMITS.PRESIGNED_URL_EXPIRY,
  ): Promise<App.Result<string>> {
    if (!r2) return not_configured();

    try {
      const url = await getSignedUrl(
        r2.client,
        new GetObjectCommand({
          Key: key,
          Bucket: r2.bucket,
        }),
        { expiresIn: expires_in },
      );

      return result.suc(url);
    } catch (error) {
      return ServiceUtil.internal(error, { log, scope: "get_download_url" });
    }
  },
};
