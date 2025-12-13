import { command } from "$app/server";
import { db } from "$lib/server/db/drizzle.db";
import { OrganizationTable } from "$lib/server/db/models/auth.model";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/services/auth.service";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { eq } from "drizzle-orm";
import z from "zod";
import { ERROR } from "$lib/const/error.const";

export const admin_delete_organization_remote = command(
  z.uuid(), //
  async (org_id) => {
    await get_session({ admin: true });

    try {
      const res = await Repo.delete_one(
        db
          .delete(OrganizationTable)
          .where(eq(OrganizationTable.id, org_id))
          .execute(),
      );

      return res;
    } catch (error) {
      Log.error(error, "admin_delete_organization_remote.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  },
);
