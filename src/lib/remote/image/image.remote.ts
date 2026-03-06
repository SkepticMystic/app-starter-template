import { command, form } from "$app/server";
import { format_bytes } from "$lib/components/ui/file-drop-zone";
import { IMAGE_HOSTING } from "$lib/const/image/image_hosting.const";
import { ImageSchema, type Image } from "$lib/server/db/models/image.model";
import { get_session } from "$lib/server/services/auth.service";
import { ImageService } from "$lib/server/services/image/image.service";
import z from "zod";

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
  async (input) => {
    const session = await get_session();
    if (!session.ok) return session;

    const results: App.Result<Image>[] = [];

    // One at a time to avoid racing the count check
    for (const file of input.files) {
      const res = await ImageService.upload({ ...input, file }, session.data);

      results.push(res);
    }

    return results;
  },
);

export const delete_image_remote = command(
  z.uuid(), //
  async (image_id) => {
    const session = await get_session();
    if (!session.ok) return session;

    return await ImageService.delete_many({ id: image_id }, session.data);
  },
);
