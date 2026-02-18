import {
  R2_ACCESS_KEY_ID,
  R2_ACCOUNT_ID,
  R2_BUCKET_NAME,
  R2_SECRET_ACCESS_KEY,
} from "$env/static/private";
import { DOCUMENT } from "$lib/const/document.const";
import { ERROR } from "$lib/const/error.const";
import { Dates } from "$lib/utils/dates";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { captureException } from "@sentry/sveltekit";
import type { Readable } from "stream";
import type z from "zod";

const log = Log.child({ service: "R2" });

// Initialize R2 client with S3-compatible endpoint
const r2_client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

type BlobPayloadInputTypes = string | Uint8Array | Buffer | Readable;
const put = async (input: {
  key: string;
  content_length?: number;
  body: BlobPayloadInputTypes;
  content_type: z.core.util.MimeTypes;

  expires_in?: number;
}): Promise<App.Result<PutObjectCommandOutput>> => {
  try {
    const res = await r2_client.send(
      new PutObjectCommand({
        Key: input.key,
        Body: input.body,
        Bucket: R2_BUCKET_NAME,
        ContentType: input.content_type,
        ContentLength: input.content_length,

        Expires: input.expires_in ? Dates.add_ms(input.expires_in) : undefined,
      }),
    );

    log.debug(res, "put.res");

    return result.suc(res);
  } catch (error) {
    log.error(error, "put.error unknown");
    captureException(error);
    return result.err(ERROR.INTERNAL_SERVER_ERROR);
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
  }): Promise<App.Result<PutObjectCommandOutput>> {
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
      log.error(error, "put_file.error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  },

  /**
   * Delete a file from R2 storage
   * @param key - R2 key path to delete
   * @returns Result<void>
   */
  async delete(key: string): Promise<App.Result<void>> {
    try {
      const delete_res = await r2_client.send(
        new DeleteObjectCommand({
          Key: key,
          Bucket: R2_BUCKET_NAME,
        }),
      );

      log.debug(delete_res, "delete.delete_res");

      return result.suc();
    } catch (error) {
      log.error(error, "delete.error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
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
    try {
      const response = await r2_client.send(
        new GetObjectCommand({
          Key: key,
          Bucket: R2_BUCKET_NAME,
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
    try {
      const url = await getSignedUrl(
        r2_client,
        new GetObjectCommand({
          Key: key,
          Bucket: R2_BUCKET_NAME,
        }),
        { expiresIn: expires_in },
      );

      return result.suc(url);
    } catch (error) {
      log.error(error, "get_download_url.error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  },
};
