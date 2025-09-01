import { command, getRequestEvent, query } from "$app/server";
import { auth } from "$lib/auth";
import { get_session } from "$lib/auth/server";
import { ORGANIZATION } from "$lib/const/organization.const";
import { AuthSchema } from "$lib/schema/auth.schema";
import { db } from "$lib/server/db/drizzle.db";
import type { FormCommandResult } from "$lib/utils/form.util";
import { fail } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import type { Invitation } from "better-auth/plugins";
import { superValidate, type Infer } from "sveltekit-superforms";
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
  async (
    data,
  ): Promise<
    FormCommandResult<
      Infer<typeof AuthSchema.Org.member_invite_form>,
      Invitation
    >
  > => {
    const [form] = await Promise.all([
      superValidate(data as any, zod4(AuthSchema.Org.member_invite_form)),
    ]);
    console.log("create_invitation.form", form);

    if (!form.valid) {
      return { type: "failure", ...fail(400, { form }) };
    }

    try {
      const data = await auth.api.createInvitation({
        body: form.data,
        headers: getRequestEvent().request.headers,
      });

      return {
        status: 201,
        type: "success",
        data: { form, data, toast: "Invitation created" },
      };
    } catch (error) {
      console.error("create_invitation.error", error);

      if (error instanceof APIError) {
        return {
          type: "failure",
          ...fail(error.statusCode, { form, message: error.message }),
        };
      } else {
        return {
          type: "failure",
          ...fail(500, { form, message: "Failed to create invitation" }),
        };
      }
    }
  },
);
