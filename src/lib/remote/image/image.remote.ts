import { format_bytes } from "#lib/components/ui/file-drop-zone/file-drop-zone-utils.js";
import { IMAGE_HOSTING } from "#lib/const/image/image_hosting.const.js";
import { ImageSchema, type Image } from "#lib/server/db/models/image.model.js";
import {
  guarded_command,
  guarded_form,
  ORG,
} from "#lib/server/remote/guarded.js";
import { ImageService } from "#lib/server/services/image/image.service.js";
import { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { result } from "#lib/utils/result.util.js";
import { z } from "zod";

const upload_limiter = new RateLimiter("image:upload", {
  max_tokens: 10,
  refill_rate: 10,
  refill_interval: 60,
});

const delete_limiter = new RateLimiter("image:delete", {
  max_tokens: 20,
  refill_rate: 20,
  refill_interval: 60,
});

export const upload_images_remote = guarded_form(
  ORG,
  ImageSchema.insert.extend({
    files: z
      .array(
        z
          .file()
          .max(
            IMAGE_HOSTING.LIMITS.MAX_FILE_SIZE_BYTES,
            `File must be smaller than ${format_bytes(IMAGE_HOSTING.LIMITS.MAX_FILE_SIZE_BYTES)}`,
          ),
      )
      .min(1, "No files to upload")
      .max(IMAGE_HOSTING.LIMITS.MAX_COUNT.PER_RESOURCE),
  }),
  async (
    input,
    { session, org_id },
  ): Promise<App.Result<App.Result<Image>[]>> => {
    // Not a guard `limit`: the cost is the file count, which the guard spends
    // before it has seen the input.
    const rate = await upload_limiter.enforce(org_id, {
      tokens: input.files.length,
      message: "Too many uploads.",
    });
    if (!rate.ok) return rate;

    const results: App.Result<Image>[] = [];

    // One at a time to avoid racing the count check. `Promise.all` here would let
    // every upload read the same pre-upload count and collectively overshoot the
    // per-org limit, so the sequencing is the point rather than an oversight.
    for (const file of input.files) {
      // oxlint-disable-next-line no-await-in-loop
      const res = await ImageService.upload({ ...input, file }, session);

      results.push(res);
    }

    return result.suc(results);
  },
);

export const delete_image_remote = guarded_command(
  {
    ...ORG,
    limit: {
      limiter: delete_limiter,
      by: "org",
      message: "Too many requests.",
    },
  },
  z.uuid(),
  async (image_id, { session }) =>
    ImageService.delete_many({ id: image_id }, session),
);
