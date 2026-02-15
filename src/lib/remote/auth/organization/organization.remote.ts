import { command, form, getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { db } from "$lib/server/db/drizzle.db";
import { OrganizationTable } from "$lib/server/db/models/auth.model";
import { Repo } from "$lib/server/db/repos/index.repo";
import { get_session } from "$lib/server/services/auth.service";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import { generateRandomString } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import z from "zod";

export const create_organization_remote = form(
  z.object({
    name: z
      .string()
      .trim()
      .min(2, "Organization name must be at least 2 characters"),
  }),
  async (input, _issue) => {
    try {
      const event = getRequestEvent();

      const session = await auth.api.getSession({
        headers: event.request.headers,
      });

      if (!session) {
        return result.err(ERROR.UNAUTHORIZED);
      }

      // Create organization via Better-Auth
      const org = await auth.api.createOrganization({
        headers: event.request.headers,
        body: {
          name: input.name,
          userId: session.user.id,
          slug: generateRandomString(8, "a-z", "0-9").toLowerCase(),
        },
      });
      if (!org) {
        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }

      // Get the member that was auto-created
      const member = org.members.at(0);
      if (!member) {
        Log.error("No member found after org creation");
        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }

      // Update session with organization context
      await (
        await auth.$context
      ).internalAdapter.updateSession(session.session.token, {
        member_id: member.id,
        member_role: member.role,
        activeOrganizationId: org.id,
      });

      return result.suc(org);
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "create_organization_remote.error better-auth");

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      } else {
        Log.error(error, "create_organization_remote.error unknown");
        captureException(error);
        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
  },
);

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
