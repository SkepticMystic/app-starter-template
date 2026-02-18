import { command, form } from "$app/server";
import { OrganizationSchema } from "$lib/server/db/models/auth.model";
import { get_session } from "$lib/server/services/auth.service";
import { OrganizationService } from "$lib/server/services/auth/organization/organization.service";
import z from "zod";

export const create_organization_remote = form(
  OrganizationSchema.create,
  async (input) => {
    const session = await get_session();

    const res = await OrganizationService.create(input, session);

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
