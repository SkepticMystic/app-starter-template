import { command, form, getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { OrganizationSchema } from "$lib/server/db/models/auth.model";
import { get_session } from "$lib/server/services/auth.service";
import { OrganizationService } from "$lib/server/services/auth/organization/organization.service";
import { result } from "$lib/utils/result.util";
import { invalid } from "@sveltejs/kit";
import z from "zod";

export const create_organization_remote = form(
  OrganizationSchema.create,
  async (input) => {
    const event = getRequestEvent();
    const session = await auth.api.getSession({
      headers: event.request.headers,
    });
    if (!session) {
      return result.err(ERROR.UNAUTHORIZED);
    } else if (!session.user.emailVerified) {
      return result.err({
        ...ERROR.FORBIDDEN,
        message: "Email not verified",
      });
    }

    const res = await OrganizationService.create(input, session);
    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const admin_delete_organization_remote = command(
  z.uuid(), //
  async (org_id) => {
    await get_session({ admin: true });

    const res = await OrganizationService.admin_delete(org_id);

    return res;
  },
);
