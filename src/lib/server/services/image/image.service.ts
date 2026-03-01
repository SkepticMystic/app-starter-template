import { format_bytes } from "$lib/components/ui/file-drop-zone";
import { ERROR } from "$lib/const/error.const";
import { IMAGE_HOSTING } from "$lib/const/image/image_hosting.const";
import type { Image } from "$lib/server/db/models/image.model";
import { ImageRepo } from "$lib/server/db/repos/image.repo";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { waitUntil } from "@vercel/functions";
import { ResourceService } from "../resource/resource.service";
import { ImageHostingService } from "./image_hosting.service";
import { ThumbhashService } from "./thumbhash.image.service";

const log = Log.child({ service: "image" });

const check_count = async (
  input: Pick<Image, "resource_id" | "resource_kind">,
  session: App.Session,
): Promise<App.Result<number>> => {
  const count = await ImageRepo.count(input, session.session.org_id);

  if (!count.ok) {
    return count;
  } else if (count.data >= IMAGE_HOSTING.LIMITS.MAX_COUNT.PER_RESOURCE) {
    return result.err({
      ...ERROR.TOO_MANY_REQUESTS,
      message: `Image limit reached for this ${input.resource_kind} (${IMAGE_HOSTING.LIMITS.MAX_COUNT.PER_RESOURCE}). Please delete existing images before uploading more`,
    });
  }

  return count;
};

const upload = async (
  input: Pick<Image, "resource_id" | "resource_kind"> & {
    file: File;
  },
  session: App.Session,
): Promise<App.Result<Image>> => {
  if (input.file.size > IMAGE_HOSTING.LIMITS.MAX_FILE_SIZE_BYTES) {
    return result.err({
      ...ERROR.TOO_LARGE,
      message: `Image exceeds size limit of ${format_bytes(
        IMAGE_HOSTING.LIMITS.MAX_FILE_SIZE_BYTES,
      )}`,
    });
  }

  const [count_limit, resource] = await Promise.all([
    check_count(input, session),
    ResourceService.get_by_id(input.resource_kind, input.resource_id, session),
  ]);

  if (!resource.ok) return resource;
  else if (!count_limit.ok) return count_limit;

  const array_buffer = await input.file.arrayBuffer();
  const buffer = Buffer.from(array_buffer);

  const [upload, thumbhash] = await Promise.all([
    ImageHostingService.upload(buffer),
    // NOTE: Calling this second in line seems to help with the timeout issue
    ThumbhashService.generate(buffer),
  ]);
  if (!upload.ok) return upload;

  // const moderation_url = transformUrl({
  //   quality: "50",
  //   format: "auto",
  //   url: upload.data.url,
  //   provider: upload.data.provider,
  //   width: Math.min(upload.data.width, 250),
  //   height: Math.min(upload.data.height, 250),
  // });
  // if (!moderation_url) {
  //   log.error("upload moderation_url is null");
  // } else {
  //   waitUntil(AIModerationService.image(moderation_url));
  // }

  const res = await ImageRepo.create({
    ...upload.data,
    resource_id: input.resource_id,
    resource_kind: input.resource_kind,

    user_id: session.session.userId,
    org_id: session.session.org_id,
    member_id: session.session.member_id,

    thumbhash: thumbhash.ok ? thumbhash.data : null,
  });

  return res;
};

const delete_many = async (
  input: Partial<Pick<Image, "id" | "resource_id" | "resource_kind">>,
  session: App.Session,
): Promise<App.Result<null>> => {
  try {
    const images = await ImageRepo.delete_many(input, session.session.org_id);

    if (!images.ok) {
      return images;
    } else if (images.data.length === 0) {
      return result.suc(null);
    }

    waitUntil(
      Promise.all(
        images.data.map((image) =>
          ImageHostingService.delete(image.external_id),
        ),
      ),
    );

    return result.suc(null);
  } catch (error) {
    log.error(error, "delete.error");

    captureException(error);

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

export const ImageService = {
  upload,
  delete_many,
};
