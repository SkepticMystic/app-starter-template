import { OrganizationSchema } from "#lib/server/db/models/auth.model.js";
import {
  ADMIN,
  define_guard,
  guarded_command,
  guarded_form,
  USER,
} from "#lib/server/remote/guarded.js";
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
    // redirect(302, App.url("/organization"));
  },
);

export const owner_delete_organization_remote = guarded_command(
  USER,
  z.uuid(),
  async (org_id) => OrganizationService.owner_delete(org_id),
);

export const admin_delete_organization_remote = guarded_command(
  ADMIN,
  z.uuid(),
  async (org_id) => OrganizationService.admin_delete(org_id),
);
