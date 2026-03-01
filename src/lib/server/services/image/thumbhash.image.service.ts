import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import * as Sentry from "@sentry/sveltekit";
import { captureException } from "@sentry/sveltekit";
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";

const log = Log.child({ service: "thumbhash" });

export const ThumbhashService = {
  generate: async (buffer: Buffer): Promise<App.Result<string>> => {
    try {
      const start_ms = performance.now();

      const image = sharp(buffer).resize(100, 100, { fit: "inside" });

      const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const binary_thumbhash = rgbaToThumbHash(info.width, info.height, data);

      const base64 = Buffer.from(binary_thumbhash).toString("base64");

      Sentry.metrics.distribution(
        "ThumbhashService.generate",
        performance.now() - start_ms,
        {
          unit: "millsecond",
          attributes: { buffer_size: buffer.length },
        },
      );

      return result.suc(base64);
    } catch (error) {
      log.error(error, "generate.error");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  },
};
