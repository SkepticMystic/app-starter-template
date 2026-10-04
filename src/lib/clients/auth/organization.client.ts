import { invalidate } from "$app/navigation";
import { page } from "$app/state";
import { BetterAuthClient } from "#lib/auth-client.js";
import {
  accept_invitation_remote,
  cancel_invitation_remote,
  resend_invitation_remote,
} from "#lib/remote/auth/organization/invitation.remote.js";
import { remove_member_remote } from "#lib/remote/auth/organization/member.remote.js";
import {
  admin_delete_organization_remote,
  owner_delete_organization_remote,
} from "#lib/remote/auth/organization/organization.remote.js";
import { BetterAuth } from "#lib/utils/better-auth.util.js";
import { result } from "#lib/utils/result.util.js";
import { Client } from "../index.client.js";

const set_active_org = async (organizationId: string | undefined) => {
  const res = await BetterAuth.to_result(
    BetterAuthClient.organization.setActive({
      organizationId,
    }),
  );

  // The UI reads the new org and role through `page.data.org`.
  await invalidate("app:session");

  return res;
};

export const OrganizationClient = {
  set_active: set_active_org,

  leave: Client.wrap(
    async (/** Fallbacks to active org_id */ org_id?: string) => {
      const organizationId = org_id ?? page.data.org?.id;

      if (!organizationId) {
        return result.err({
          status: 400,
          message: "Organization ID is required",
        });
      }

      const res = await BetterAuthClient.organization.leave({
        organizationId,
      });

      return BetterAuth.to_result(res);
    },
    {
      confirm:
        "Leave this organization? You'll lose access to it until someone invites you back.",
      destructive: true,
      action_label: "Leave organization",
      suc_msg: "Left organization",
    },
  ),

  delete: Client.wrap(owner_delete_organization_remote, {
    confirm:
      "Delete this organization? Every member loses access, its API keys stop working and its data is deleted. This cannot be undone.",
    destructive: true,
    action_label: "Delete organization",
    suc_msg: "Organization deleted",
  }),

  admin_delete: Client.wrap(
    (org_id: string) => admin_delete_organization_remote(org_id),
    {
      confirm:
        "Delete this organization? Every member loses access, its API keys stop working and its data is deleted. This cannot be undone.",
      destructive: true,
      action_label: "Delete organization",
      suc_msg: "Organization deleted",
    },
  ),

  invitation: {
    // Better-Auth makes the org active server-side, and the page reloads after.
    accept: Client.wrap(accept_invitation_remote, {
      suc_msg: "Invitation accepted",
    }),

    resend: Client.wrap(resend_invitation_remote, {
      suc_msg: "Invitation resent",
    }),

    cancel: Client.wrap(cancel_invitation_remote, {
      confirm:
        "Cancel this invitation? Its link will stop working. You can invite them again later.",
      destructive: true,
      action_label: "Cancel invitation",
    }),
  },

  member: {
    update_role: Client.wrap(
      async (
        input: Parameters<
          typeof BetterAuthClient.organization.updateMemberRole
        >[0],
      ) => {
        const update_res = await BetterAuth.to_result(
          BetterAuthClient.organization.updateMemberRole(input),
        );

        return update_res;
      },
      {
        suc_msg: "Member role updated",
        confirm:
          "Change this member's role? It changes what they can see and do in this organization.",
        action_label: "Change role",
      },
    ),

    remove: Client.wrap(remove_member_remote, {
      confirm:
        "Remove this member? They lose access to this organization until someone invites them back.",
      destructive: true,
      action_label: "Remove member",
      suc_msg: "Member removed",
    }),
  },
};
