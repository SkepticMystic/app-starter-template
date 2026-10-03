import { command, form, getRequestEvent } from "$app/server";
import { auth } from "#lib/auth.js";
import { ERROR } from "#lib/const/error.const.js";
import { OrganizationSchema } from "#lib/server/db/models/auth.model.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { OrganizationService } from "#lib/server/services/auth/organization/organization.service.js";
import { result } from "#lib/utils/result.util.js";
import { invalid } from "@sveltejs/kit";
import { z } from "zod";

export const create_organization_remote = form(
  OrganizationSchema.create,
  async (input) => {
    const event = getRequestEvent();
    const session = await auth.api.getSession({
      headers: event.request.headers,
    });
    if (!session) {
      return result.err(ERROR.UNAUTHORIZED);
    }

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

export const owner_delete_organization_remote = command(
  z.uuid(), //
  async (org_id) => {
    const session = await get_session();
    if (!session.ok) return session;

    const res = await OrganizationService.owner_delete(org_id);

    return res;
  },
);

export const admin_delete_organization_remote = command(
  z.uuid(), //
  async (org_id) => {
    const session = await get_session({ admin: true });
    if (!session.ok) return session;

    const res = await OrganizationService.admin_delete(org_id);

    return res;
  },
);
