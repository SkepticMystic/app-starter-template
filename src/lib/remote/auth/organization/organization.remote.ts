import { command } from "$app/server";
import { get_session } from "$lib/auth/server";
import { db } from "$lib/server/db/drizzle.db";
import { OrganizationTable } from "$lib/server/db/models/auth.model";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { eq } from "drizzle-orm";
import z from "zod";

export const admin_delete_organization_remote = command(
  z.uuid(), //
  async (org_id) => {
    await get_session({ admin: true });

    try {
      const res = await db
        .delete(OrganizationTable)
        .where(eq(OrganizationTable.id, org_id))
        .execute();

      return res.rowCount ? result.suc() : result.err({ message: "Organization not found" });
    } catch (error) {
      Log.error(error, "admin_delete_organization_remote.error unknown");

      captureException(error);

      return result.err({ message: "Internal server error" });
    }
  },
);
