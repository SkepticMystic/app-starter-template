import { getRequestEvent } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { db } from "$lib/server/db/drizzle.db";
import { OrganizationTable, type OrganizationSchema } from "$lib/server/db/models/auth.model";
import { Repo } from "$lib/server/db/repos/index.repo";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import { generateRandomString } from "better-auth/crypto";
import type { Organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import type z from "zod";
import { authorize_event } from "../../auth.service";
import { SessionService } from "../session/session.service";

const log = Log.child({ service: "Organization" });

const create = async (
  input: z.output<typeof OrganizationSchema.create>,
  session: { session: { token: string }; user: { id: string } },
): Promise<App.Result<Organization>> => {
  const l = log.child({ method: "create" });

  try {
    // Create organization via Better-Auth
    const org = await auth.api.createOrganization({
      body: {
        name: input.name,
        logo: input.logo,
        userId: session.user.id,
        keepCurrentActiveOrganization: false,
        slug: generateRandomString(8, "a-z", "0-9").toLowerCase(),
      },
    });
    if (!org) {
      l.error("No org created");
      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to create organization",
      });
    }

    // Get the member that was auto-created
    const member = org.members.at(0);
    if (!member) {
      l.error("No member found after org creation");
      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to create organization member",
      });
    }

    // Update session with organization context
    await SessionService.patch(
      {
        org_id: org.id,
        member_id: member.id,
        member_role: member.role,
        activeOrganizationId: org.id,
      },
      session,
    );

    return result.suc(org);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      if (is_ba_error_code(error, "ORGANIZATION_SLUG_ALREADY_TAKEN")) {
        return result.from_ba_error(error, { path: ["name"] });
      }

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const owner_delete = async (org_id: string, session: App.Session) => {
  const l = log.child({ method: "owner_delete" });

  try {
    // Delete organization via Better-Auth
    const res = await auth.api.deleteOrganization({
      headers: getRequestEvent().request.headers,
      body: { organizationId: org_id },
    });

    // TODO: I could setActiveOrg on some other org they're a member of
    // But I think the actual solution is to allow an authenticated user to not have an active org
    // Then some capture page that lets them choose an org to set as active
    // Cloudflare does this

    if (session.session.activeOrganizationId === org_id) {
      await SessionService.patch(
        {
          org_id: null,
          member_id: null,
          member_role: null,
          activeOrganizationId: null,
        },
        session,
      );
    }

    return result.suc(res);
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const admin_delete = async (org_id: string) => {
  const check = authorize_event({ admin: true });
  if (!check.ok) return check;

  const l = log.child({ method: "admin_delete" });

  try {
    const res = await Repo.delete_one(
      db.delete(OrganizationTable).where(eq(OrganizationTable.id, org_id)).execute(),
    );

    return res;
  } catch (error) {
    if (error instanceof APIError) {
      l.info(error.body, "error better-auth");

      captureException(error);

      return result.from_ba_error(error);
    } else {
      l.error(error, "error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

export const OrganizationService = {
  create,
  owner_delete,
  admin_delete,
};
