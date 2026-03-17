import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from "$env/static/private";
import { ERROR } from "$lib/const/error.const";
import type { IMAGE_HOSTING } from "$lib/const/image/image_hosting.const";
import type { Result } from "$lib/interfaces/result.type";
import type { Image } from "$lib/server/db/models/image.model";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import * as Sentry from "@sentry/sveltekit";
import { captureException } from "@sentry/sveltekit";
import { v2 as cloudinary, type UploadApiErrorResponse, type UploadApiResponse } from "cloudinary";

const log = Log.child({ service: "cloudinary" });

cloudinary.config({
  api_secret: CLOUDINARY_API_SECRET,
  api_key: CLOUDINARY_API_KEY,
  cloud_name: CLOUDINARY_CLOUD_NAME,
});

const provider = "cloudinary" as const satisfies (typeof IMAGE_HOSTING.PROVIDER.IDS)[number];

export const ImageHostingService = {
  upload: async (
    buffer: Buffer,
  ): Promise<
    App.Result<Pick<Image, "url" | "external_id" | "size" | "width" | "height" | "provider">>
  > => {
    try {
      const start_ms = performance.now();

      const res: Result<UploadApiResponse, UploadApiErrorResponse> = await new Promise(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                resource_type: "image",
                discard_original_filename: true,
                upload_preset: CLOUDINARY_UPLOAD_PRESET,
                // NOTE: We don't apply any transforms at upload time
                // Rather keep the original, then transform in Picture.svelte
              },
              (error, data) => {
                if (error) {
                  return resolve(result.err(error));
                } else if (data) {
                  return resolve(result.suc(data));
                } else {
                  return reject(new Error("Unexpected upload result: no error and no data"));
                }
              },
            )
            .end(buffer);
        },
      );

      Sentry.metrics.distribution("ImageHostingService.upload", performance.now() - start_ms, {
        unit: "millisecond",
        attributes: {
          provider,
          buffer_size: buffer.length,
        },
      });

      log.info(res, "res");
      if (!res.ok) {
        log.error(res.error, "upload.error");

        captureException(res.error);

        return result.err({
          ...ERROR.INTERNAL_SERVER_ERROR,
          message: "Failed to upload image",
        });
      } else {
        return result.suc({
          provider,
          size: res.data.bytes,
          width: res.data.width,
          height: res.data.height,

          url: res.data.secure_url,
          external_id: res.data.public_id,
        });
      }
    } catch (error) {
      log.error(error, "upload.error");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  },

  delete: async (external_id: string): Promise<App.Result<null>> => {
    try {
      const start_ms = performance.now();

      await cloudinary.uploader.destroy(external_id, { resource_type: "image" }).then((res) => {
        log.debug(res, "res");

        if (res?.result !== "ok" && res?.result !== "not found") {
          return Promise.reject(res);
        }
      });

      Sentry.metrics.distribution("ImageHostingService.delete", performance.now() - start_ms, {
        unit: "millsecond",
        attributes: { provider },
      });

      return result.suc(null);
    } catch (error) {
      log.error(error, "delete.error");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  },
};
