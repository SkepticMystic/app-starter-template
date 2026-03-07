import { command, form } from "$app/server";
import { format_bytes } from "$lib/components/ui/file-drop-zone";
import { ERROR } from "$lib/const/error.const";
import { IMAGE_HOSTING } from "$lib/const/image/image_hosting.const";
import { ImageSchema, type Image } from "$lib/server/db/models/image.model";
import { get_session } from "$lib/server/services/auth.service";
import { ImageService } from "$lib/server/services/image/image.service";
import { RateLimiter } from "$lib/server/services/rate_limit/rate_limit.service";
import { result } from "$lib/utils/result.util";
import z from "zod";

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

export const upload_images_remote = form(
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
  async (input): Promise<App.Result<App.Result<Image>[]>> => {
    const session = await get_session();
    if (!session.ok) return session;
    else if (!session.data.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const rate = await upload_limiter.consume(
      session.data.session.org_id,
      input.files.length,
    );
    if (!rate.ok) return rate;
    else if (!rate.data.allowed) {
      return result.err(ERROR.TOO_MANY_REQUESTS);
    }

    const results: App.Result<Image>[] = [];

    // One at a time to avoid racing the count check
    for (const file of input.files) {
      const res = await ImageService.upload({ ...input, file }, session.data);

      results.push(res);
    }

    return result.suc(results);
  },
);

export const delete_image_remote = command(
  z.uuid(), //
  async (image_id) => {
    const session = await get_session();
    if (!session.ok) return session;
    else if (!session.data.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const rate = await delete_limiter.consume(session.data.session.org_id);
    if (!rate.ok) return rate;
    else if (!rate.data.allowed) {
      return result.err(ERROR.TOO_MANY_REQUESTS);
    }

    return await ImageService.delete_many({ id: image_id }, session.data);
  },
);
