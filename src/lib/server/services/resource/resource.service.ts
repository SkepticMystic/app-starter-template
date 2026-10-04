import { ERROR } from "#lib/const/error.const.js";
import type { RESOURCE } from "#lib/const/resource/resource.const.js";
import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";

const get_by_id = async (
  resource_kind: (typeof RESOURCE.KINDS)[number],
  resource_id: string,
  session: App.Session,
): Promise<App.Result<{ id: string }>> => {
  switch (resource_kind) {
    case "user": {
      // Only your own user, so there is nothing to look up for anyone else's.
      if (resource_id !== session.session.userId) {
        return result.err(ERROR.FORBIDDEN);
      }

      const res = await Repo.query(
        db.query.user.findFirst({
          columns: { id: true },
          where: { id: resource_id },
        }),
      );

      if (!res.ok) {
        return res;
      } else if (!res.data) {
        return result.err(ERROR.NOT_FOUND);
      } else {
        return result.suc(res.data);
      }
    }

    case "organization": {
      if (resource_id !== session.session.org_id) {
        return result.err(ERROR.FORBIDDEN);
      }

      const res = await Repo.query(
        db.query.organization.findFirst({
          columns: { id: true },
          where: { id: resource_id },
        }),
      );

      if (!res.ok) {
        return res;
      } else if (!res.data) {
        return result.err(ERROR.NOT_FOUND);
      } else {
        return result.suc(res.data);
      }
    }

    default: {
      Log.error(`Unsupported resource kind: ${String(resource_kind)}`);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

export const ResourceService = {
  get_by_id,
};
