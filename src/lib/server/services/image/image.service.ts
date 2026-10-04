import { format_bytes } from "#lib/components/ui/file-drop-zone/file-drop-zone-utils.js";
import { ERROR } from "#lib/const/error.const.js";
import { IMAGE_HOSTING } from "#lib/const/image/image_hosting.const.js";
import { db } from "#lib/server/db/drizzle.db.js";
import {
  ImageTable,
  type Image,
  type ImageSchema,
} from "#lib/server/db/models/image.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { filter_sql } from "#lib/server/db/sql.util.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { RuntimeService } from "../runtime/runtime.service.js";
import { operators as o } from "drizzle-orm";
import type { z } from "zod/mini";
import { AIModerationService } from "../moderation/ai.moderation.service.js";
import { ResourceService } from "../resource/resource.service.js";
import { ImageHostingService } from "./image_hosting.service.js";
import { ThumbhashService } from "./thumbhash.image.service.js";

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

    const res = await Repo.count(
      db.$count(
        ImageTable,
        filter_sql(ImageTable, {
          org_id: session.session.org_id,
          resource_id: input.resource_id,
          resource_kind: input.resource_kind,
        }),
      ),
    );

    if (!res.ok) return res;

    const c = res.data;

    if (c >= IMAGE_HOSTING.LIMITS.MAX_COUNT.PER_RESOURCE) {
      return result.err({
        ...ERROR.TOO_MANY_REQUESTS,
        message: `Image limit reached for this ${input.resource_kind} (${IMAGE_HOSTING.LIMITS.MAX_COUNT.PER_RESOURCE}). Please delete existing images before uploading more`,
      });
    }

    return result.suc(c);
  } catch (error) {
    l.error(error, "error unknown");

    captureException(error, { contexts: { check_count: { input } } });

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

const upload = async (
  input: z.output<(typeof ImageSchema)["insert"]> & {
    file: File;
  },
  session: App.Session,
): Promise<App.Result<Image>> => {
  try {
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
      ResourceService.get_by_id(
        input.resource_kind,
        input.resource_id,
        session,
      ),
    ]);

    if (!resource.ok) return resource;
    else if (!count_limit.ok) return count_limit;

    const array_buffer = await input.file.arrayBuffer();
    const buffer = Buffer.from(array_buffer);

    const [upload_res, thumbhash] = await Promise.all([
      ImageHostingService.upload(buffer),
      // NOTE: Calling this second in line seems to help with the timeout issue.
      // sharp doesn't support SVG, so skip thumbhash generation for SVGs.
      input.file.type.includes("svg")
        ? result.err(ERROR.INVALID_INPUT)
        : ThumbhashService.generate(buffer),
    ]);
    if (!upload_res.ok) return upload_res;

    // Every failure past this point leaves an asset nothing references.
    const { external_id } = upload_res.data;
    const discard = () =>
      RuntimeService.defer(async () => ImageHostingService.delete(external_id));

    const moderation = await AIModerationService.image(upload_res.data.url);
    if (!moderation.ok) {
      discard();
      return moderation;
    } else if (moderation.data.flagged) {
      discard();

      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "This image isn't allowed. Please choose another",
      });
    }

    const image = await Repo.insert_one(
      db
        .insert(ImageTable)
        .values({
          ...upload_res.data,
          resource_id: input.resource_id,
          resource_kind: input.resource_kind,

          user_id: session.session.userId,
          org_id: session.session.org_id,
          member_id: session.session.member_id,

          thumbhash: thumbhash.ok ? thumbhash.data : null,
        })
        .returning(),
    );
    if (!image.ok) discard();

    return image;
  } catch (error) {
    log.error(error, "upload.error unknown");

    captureException(error, {
      tags: {
        resource_id: input.resource_id,
        resource_kind: input.resource_kind,
      },
      contexts: {
        upload: {
          resource_id: input.resource_id,
          resource_kind: input.resource_kind,
        },
      },
    });

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

const delete_many = async (
  input: Partial<Pick<Image, "id" | "resource_id" | "resource_kind">>,
  session: App.Session,
): Promise<App.Result<undefined>> => {
  try {
    if (!session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }
    // With neither, the filter below would match every image in the org.
    else if (!input.id && !input.resource_id) {
      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "An image or resource id is required",
      });
    }

    const images = await Repo.query(
      db
        .delete(ImageTable)
        .where(
          o.and(
            o.eq(ImageTable.org_id, session.session.org_id),
            input.id ? o.eq(ImageTable.id, input.id) : undefined,
            input.resource_id
              ? o.eq(ImageTable.resource_id, input.resource_id)
              : undefined,
            input.resource_kind
              ? o.eq(ImageTable.resource_kind, input.resource_kind)
              : undefined,
          ),
        )
        .returning(),
    );

    if (!images.ok) {
      return images;
    } else if (images.data.length === 0) {
      return result.suc(undefined);
    }

    RuntimeService.defer(async () =>
      Promise.all(
        images.data.map((image) =>
          ImageHostingService.delete(image.external_id),
        ),
      ),
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
