import { OrganizationSchema } from "#lib/server/db/models/auth.model.js";
import {
  ADMIN,
  define_guard,
  guarded_command,
  guarded_form,
  guarded_query,
  ORG,
  USER,
} from "#lib/server/remote/guarded.js";
import { ERROR } from "#lib/const/error.const.js";
import { result } from "#lib/utils/result.util.js";
import { OrganizationService } from "#lib/server/services/auth/organization/organization.service.js";
import { invalid } from "@sveltejs/kit";
import { z } from "zod";

/**
 * Onboarding reaches here before anything checks the address, as it did when
 * this read Better-Auth's session by hand; the organization plugin's own
 * checks still apply.
 */
const ONBOARDING = define_guard({
  level: "user",
  session: { email_verified: false },
});

export const create_organization_remote = guarded_form(
  ONBOARDING,
  OrganizationSchema.create,
  async (input, { session }) => {
    const res = await OrganizationService.create(input, session);
    if (!res.ok) {
      if (res.error.path) {
        invalid(res.error);
      } else {
        return res;
      }
    }

    return res;
  },
);

export const set_active_organization_remote = guarded_command(
  ONBOARDING,
  z.uuid(),
  async (org_id) => OrganizationService.set_active(org_id),
);

/** Leaves the active org, the one the guard resolved the membership in. */
export const leave_organization_remote = guarded_command(
  ORG,
  async ({ org_id }) => OrganizationService.leave(org_id),
);

export const list_organizations_remote = guarded_query(USER, async () =>
  OrganizationService.list(),
);

export const owner_delete_organization_remote = guarded_command(
  { ...ORG, session: { org_permissions: { organization: ["delete"] } } },
  z.uuid(),
  async (org_id, ctx) =>
    // The permission was checked against the active org, so only that one.
    org_id === ctx.org_id
      ? OrganizationService.owner_delete(org_id)
      : result.err(ERROR.FORBIDDEN),
);

export const admin_delete_organization_remote = guarded_command(
  ADMIN,
  z.uuid(),
  async (org_id) => OrganizationService.admin_delete(org_id),
);
