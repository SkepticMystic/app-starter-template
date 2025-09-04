import { command, getRequestEvent, query } from "$app/server";
import { auth } from "$lib/auth";
import { get_session } from "$lib/auth/server";
import { ORGANIZATION } from "$lib/const/organization.const";
import { AuthSchema } from "$lib/schema/auth.schema";
import { db } from "$lib/server/db/drizzle.db";
import type { FormSubmitResult } from "$lib/utils/form.util";
import { err, suc } from "$lib/utils/result.util";
import { APIError } from "better-auth/api";
import type { Invitation } from "better-auth/plugins";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import z from "zod";

export const get_invitations = query(
  z.object({
    status: z.enum(ORGANIZATION.INVITATIONS.STATUSES.IDS).optional(),
  }),
  async (input) => {
    const session = await get_session();

    const invitations = await db.query.invitation.findMany({
      where: (invitation, { eq, and }) =>
        and(
          eq(invitation.organizationId, session.session.org_id),
          input.status ? eq(invitation.status, input.status) : undefined,
        ),

      orderBy: (invitation, { desc }) => [desc(invitation.createdAt)],

      columns: {
        id: true,
        status: true,
        email: true,
        expiresAt: true,
        role: true,
        createdAt: true,
      },
    });

    return invitations;
  },
);

export const create_invitation = command(
  "unchecked",
  async (data): Promise<FormSubmitResult<Invitation>> => {
    const [form] = await Promise.all([
      superValidate(data as any, zod4(AuthSchema.Org.member_invite_form)),
    ]);
    console.log("create_invitation.form", form);

    if (!form.valid) {
      return err();
    }

    try {
      const data = await auth.api.createInvitation({
        body: form.data,
        headers: getRequestEvent().request.headers,
      });

      return suc(data);
    } catch (error) {
      console.error("create_invitation.error", error);

      if (error instanceof APIError) {
        return err({ message: error.message });
      } else {
        return err({ message: "Failed to create invitation" });
      }
    }
  },
);
