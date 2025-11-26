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
import { BetterAuth } from "$lib/utils/better-auth.util";
import { result } from "$lib/utils/result.util";
import { Client } from "../index.client";
import { session } from "$lib/stores/session";

export const OrganizationClient = {
  set_active: (organizationId: string | undefined) =>
    Client.better_auth(
      () => BetterAuthClient.organization.setActive({ organizationId }),
      { toast: { success: "Active organization updated." } },
    ),

  leave: (/** Fallbacks to active org_id */ org_id?: string) =>
    Client.request(
      async () => {
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
        toast: { success: "Left organization successfully." },
      },
    ),

  delete: (organizationId: string) =>
    Client.better_auth(
      () => BetterAuthClient.organization.delete({ organizationId }),
      {
        confirm: "Are you sure you want to delete this organization?",
        toast: { success: "Organization deleted successfully." },
      },
    ),

  invitation: {
    accept: (invitationId: string) =>
      Client.better_auth(
        () => BetterAuthClient.organization.acceptInvitation({ invitationId }),
        { toast: { success: "Invitation accepted" } },
      ),

    cancel: (invitation_id: string) =>
      Client.request(
        () =>
          cancel_invitation_remote(invitation_id).updates(
            get_all_invitations_remote().withOverride((cur) =>
              cur.filter((i) => i.id !== invitation_id),
            ),
          ),
        {
          confirm: "Are you sure you want to cancel this invitation?",
          toast: {
            optimistic: true,
            success: "Invitation cancelled successfully.",
          },
        },
      ),
  },

  member: {
    update_role: (memberId: string, role: IOrganization.RoleId) =>
      Client.request(
        async () => {
          const update_res = await BetterAuth.to_result(
            BetterAuthClient.organization.updateMemberRole({ role, memberId }),
          );

          if (update_res.ok) {
            await get_all_members_remote().refresh();
          }

          return update_res;
        },
        {
          confirm: `Are you sure you want to update this member's role to ${ORGANIZATION.ROLES.MAP[role].label}?`,
          toast: { success: "Member role updated successfully." },
        },
      ),

    // TODO: Report a bug on better-auth orgs
    // - Owner A invited member B
    // - Member B tried to remove Owner A
    // - The error says: "You cannot leave the organization as the only owner"
    // - But it should be a permission error, since B is not an owner
    remove: (input: Parameters<typeof remove_member_remote>[0]) =>
      Client.request(
        () =>
          remove_member_remote(input).updates(
            get_all_members_remote().withOverride((members) =>
              members.filter((m) => m.id !== input),
            ),
          ),
        {
          confirm: "Are you sure you want to remove this member?",
          toast: { success: "Member removed successfully." },
        },
      ),
  },
};
