import { BetterAuthClient } from "$lib/auth-client";
import {
  ORGANIZATION,
  type IOrganization,
} from "$lib/const/auth/organization.const";
import {
  cancel_invitation_remote,
  get_all_invitations_remote,
} from "$lib/remote/auth/organization/invitation.remote";
import {
  get_all_members_remote,
  remove_member_remote,
} from "$lib/remote/auth/organization/member.remote";
import { admin_delete_organization_remote } from "$lib/remote/auth/organization/organization.remote";
import { session } from "$lib/stores/session.store";
import { BetterAuth } from "$lib/utils/better-auth.util";
import { result } from "$lib/utils/result.util";
import { Client } from "../index.client";

export const OrganizationClient = {
  set_active: Client.better_auth((organizationId: string | undefined) =>
    BetterAuthClient.organization.setActive({ organizationId }),
  ),

  leave: Client.wrap(
    async (/** Fallbacks to active org_id */ org_id?: string) => {
      const organizationId =
        org_id ?? session.get().data?.session.activeOrganizationId;

      if (!organizationId) {
        return result.err({ message: "Organization ID is required" });
      }

      const res = await BetterAuthClient.organization.leave({
        organizationId,
      });

      return BetterAuth.to_result(res);
    },
    {
      confirm: "Are you sure you want to leave this organization?",
      suc_msg: "Left organization",
    },
  ),

  delete: Client.better_auth(
    (organizationId: string) =>
      BetterAuthClient.organization.delete({ organizationId }),
    {
      confirm: "Are you sure you want to delete this organization?",
      suc_msg: "Organization deleted",
    },
  ),

  admin_delete: Client.wrap(
    (org_id: string) => admin_delete_organization_remote(org_id),
    {
      confirm: "Are you sure you want to delete this organization?",
    },
  ),

  invitation: {
    accept: Client.better_auth(
      (invitationId: string) =>
        BetterAuthClient.organization.acceptInvitation({ invitationId }),
      { suc_msg: "Invitation accepted" },
    ),

    cancel: Client.wrap(
      (invitation_id: string) =>
        cancel_invitation_remote(invitation_id).updates(
          get_all_invitations_remote().withOverride((cur) =>
            cur.filter((i) => i.id !== invitation_id),
          ),
        ),
      {
        optimistic: true,
        confirm: "Are you sure you want to cancel this invitation?",
      },
    ),
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

        if (update_res.ok) {
          await get_all_members_remote().refresh();
        }

        return update_res;
      },
      {
        suc_msg: "Member role updated",
        confirm: (input) =>
          `Are you sure you want to update this member's role to ${ORGANIZATION.ROLES.MAP[input.role as IOrganization.RoleId].label}?`,
      },
    ),

    remove: Client.wrap(
      (input: Parameters<typeof remove_member_remote>[0]) =>
        remove_member_remote(input).updates(
          get_all_members_remote().withOverride((members) =>
            members.filter((m) => m.id !== input),
          ),
        ),
      {
        confirm: "Are you sure you want to remove this member?",
        suc_msg: "Member removed",
      },
    ),
  },
};
