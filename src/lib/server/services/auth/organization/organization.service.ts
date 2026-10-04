import { getRequestEvent } from "$app/server";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { auth, is_ba_error_code } from "#lib/auth.js";
import { ERROR } from "#lib/const/error.const.js";
import { type OrganizationSchema } from "#lib/server/db/models/auth.model.js";
import { APIKeyRepo } from "#lib/server/db/repos/apikey.repo.js";
import { OrganizationRepo } from "#lib/server/db/repos/organization.repo.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import { generateRandomString } from "better-auth/crypto";
import type { Organization } from "better-auth/plugins";
import type { z } from "zod";
import { authorize_event } from "../../auth.service";
import { MemberSessionService } from "./member_session.service";

const log = Log.child({ service: "Organization" });

const create = async (
  input: z.output<typeof OrganizationSchema.create>,
  session: { user: { id: string } },
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

    // Called without headers, so there is no session to switch: the client
    // sets the new org active itself (`OrganizationClient.set_active`).

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

/**
 * What deleting an org owes the people and keys that pointed at it. `member`
 * cascades with the row; nothing else does. Every member's sessions keep the
 * org's derived fields (`org_id`, `member_role`) and renew themselves while in
 * use, and an API key holds its org as a plain `referenceId`. Better-Auth's
 * `deleteOrganization` clears only the *caller's* active org; the admin path
 * skips even that.
 *
 * Runs after the delete, and logs rather than fails: the org is gone either
 * way, and telling the caller otherwise would invite a retry against nothing.
 */
const revoke_access = async (org_id: string, user_ids: string[]) => {
  const l = log.child({ method: "revoke_access", org_id });
  const store = (await auth.$context).internalAdapter;

  const revoked = await Promise.all(
    user_ids.map((user_id) =>
      MemberSessionService.revoke(store, { user_id, org_id }),
    ),
  );

  const keys = await APIKeyRepo.delete_by_reference({ org_id });

  if (!keys.ok) {
    l.error({ error: keys.error }, "revoke_access.keys_not_deleted");
    captureException(new Error("Deleted organization kept its API keys"), {
      extra: { org_id },
    });
  }

  l.info(
    {
      members: user_ids.length,
      failed: revoked.filter((r) => !r.ok).length,
      keys: keys.ok ? keys.data.row_count : null,
    },
    "revoke_access.ok",
  );
};

/** Read first: `member` cascades with the row. */
const members_before_delete = async (org_id: string) =>
  OrganizationRepo.list_member_user_ids({ id: org_id });

const owner_delete = async (org_id: string) => {
  const l = log.child({ method: "owner_delete" });

  const members = await members_before_delete(org_id);
  if (!members.ok) return members;

  try {
    // Clears the caller's active org through our `session.update` hook;
    // everybody else's is `revoke_access`'s job.
    //
    // TODO: I could setActiveOrg on some other org they're a member of
    // But I think the actual solution is to allow an authenticated user to not have an active org
    // Then some capture page that lets them choose an org to set as active
    // Cloudflare does this
    const res = await auth.api.deleteOrganization({
      headers: getRequestEvent().request.headers,
      body: { organizationId: org_id },
    });

    await revoke_access(org_id, members.data);

    return result.suc(res);
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: l });
  }
};

/**
 * A platform admin deleting somebody else's org, beneath Better-Auth (whose
 * delete needs an owner), so {@link revoke_access} is the whole of the cleanup.
 */
const admin_delete = async (org_id: string) => {
  const check = authorize_event({ admin: true });
  if (!check.ok) return check;

  const members = await members_before_delete(org_id);
  if (!members.ok) return members;

  const deleted = await OrganizationRepo.delete_by_id({ id: org_id });
  if (!deleted.ok) return deleted;

  await revoke_access(org_id, members.data);

  return deleted;
};

export const OrganizationService = {
  create,
  owner_delete,
  admin_delete,
};
