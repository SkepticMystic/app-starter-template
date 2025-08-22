import { BetterAuthClient } from "$lib/auth-client";
import { err, suc } from "$lib/utils";
import { Client } from "./index.client";

export const OrganizationsClient = {
  invite_member: (input: {
    email: string;
    role: "member" | "admin" | "owner";
  }) =>
    Client.request(
      async () => {
        const res = await BetterAuthClient.organization.inviteMember(input);

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn("Failed to invite member:", res.error);
          return err(
            res.error?.message ?? "Failed to invite member. Please try again.",
          );
        }
      },
      { toast: { suc: "Member invited successfully." } },
    ),

  accept_invitation: (invitation_id: string) =>
    Client.request(
      async () => {
        const res = await BetterAuthClient.organization.acceptInvitation({
          invitationId: invitation_id,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn(res.error);
          return err(
            res.error?.message ??
              "Failed to accept invitation. Please try again.",
          );
        }
      },
      { toast: { suc: "Invitation accepted successfully." } },
    ),

  cancel_invitation: (invitation_id: string) =>
    Client.request(
      async () => {
        if (!confirm("Are you sure you want to cancel this invitation?")) {
          return err();
        }

        const res = await BetterAuthClient.organization.cancelInvitation({
          invitationId: invitation_id,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn(res.error);
          return err(
            res.error?.message ??
              "Failed to delete invitation. Please try again.",
          );
        }
      },
      { toast: { suc: "Invitation cancelled successfully." } },
    ),
};
