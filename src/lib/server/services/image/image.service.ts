import { format_bytes } from "$lib/components/ui/file-drop-zone";
import { ERROR } from "$lib/const/error.const";
import { IMAGE_HOSTING } from "$lib/const/image/image_hosting.const";
import { db } from "$lib/server/db/drizzle.db";
import { ImageTable, type Image } from "$lib/server/db/models/image.model";
import { ImageRepo } from "$lib/server/db/repos/image.repo";
import { Repo } from "$lib/server/db/repos/index.repo";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { waitUntil } from "@vercel/functions";
import { count, operators as o } from "drizzle-orm";
import { AIModerationService } from "../moderation/ai.moderation.service";
import { ResourceService } from "../resource/resource.service";
import { ImageHostingService } from "./image_hosting.service";
import { ThumbhashService } from "./thumbhash.image.service";

const log = Log.child({ service: "image" });

const check_count = async (
  input: Pick<Image, "resource_id" | "resource_kind">,
  session: App.Session,
): Promise<App.Result<number>> => {
  const l = log.child({ method: "check_count" });

  try {
    if (!session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const res = await Repo.query(
      db
        .select({ count: count(ImageTable.id) })
        .from(ImageTable)
        .where(
          o.and(
            o.eq(ImageTable.org_id, session.session.org_id),
            o.eq(ImageTable.resource_id, input.resource_id),
            o.eq(ImageTable.resource_kind, input.resource_kind),
          ),
        )
        .execute(),
    );

    if (!res.ok) return res;

    const c = res.data[0]?.count ?? 0;

    if (c >= IMAGE_HOSTING.LIMITS.MAX_COUNT.PER_RESOURCE) {
      return result.err({
        ...ERROR.TOO_MANY_REQUESTS,
        message: `Image limit reached for this ${input.resource_kind} (${IMAGE_HOSTING.LIMITS.MAX_COUNT.PER_RESOURCE}). Please delete existing images before uploading more`,
      });
    }

    return result.suc(c);
  } catch (error) {
    l.error(error, "error unknown");

    captureException(error, { extra: { input } });

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

const upload = async (
  input: Pick<Image, "resource_id" | "resource_kind"> & {
    file: File;
  },
  session: App.Session,
): Promise<App.Result<Image>> => {
  if (!session.session.org_id || !session.session.member_id) {
    return result.err(ERROR.FORBIDDEN);
  } else if (input.file.size > IMAGE_HOSTING.LIMITS.MAX_FILE_SIZE_BYTES) {
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

  const [upload_res, thumbhash] = await Promise.all([
    ImageHostingService.upload(buffer),
    // NOTE: Calling this second in line seems to help with the timeout issue
    ThumbhashService.generate(buffer),
  ]);
  if (!upload_res.ok) return upload_res;

  const moderation = await AIModerationService.image(upload_res.data.url);
  if (!moderation.ok) return moderation;
  else if (moderation.data.flagged) {
    await ImageHostingService.delete(upload_res.data.external_id);

    return result.err({
      ...ERROR.INTERNAL_SERVER_ERROR,
      message: "Image moderation flagged",
    });
  }

  const image = await ImageRepo.create({
    ...upload_res.data,
    resource_id: input.resource_id,
    resource_kind: input.resource_kind,

    user_id: session.session.userId,
    org_id: session.session.org_id,
    member_id: session.session.member_id,

    thumbhash: thumbhash.ok ? thumbhash.data : null,
  });

  return image;
};

const delete_many = async (
  input: Partial<Pick<Image, "id" | "resource_id" | "resource_kind">>,
  session: App.Session,
): Promise<App.Result<undefined>> => {
  try {
    if (!session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const images = await Repo.query(
      db
        .delete(ImageTable)
        .where(
          o.and(
            o.eq(ImageTable.org_id, session.session.org_id),
            input.id ? o.eq(ImageTable.id, input.id) : undefined,
            input.resource_id ? o.eq(ImageTable.resource_id, input.resource_id) : undefined,
            input.resource_kind ? o.eq(ImageTable.resource_kind, input.resource_kind) : undefined,
          ),
        )
        .returning(),
    );

    if (!images.ok) {
      return images;
    } else if (images.data.length === 0) {
      return result.suc(undefined);
    }

    waitUntil(
      Promise.all(images.data.map((image) => ImageHostingService.delete(image.external_id))),
    );

    return result.suc(undefined);
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
