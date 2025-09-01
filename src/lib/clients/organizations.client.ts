import { BetterAuthClient } from "$lib/auth-client";
import { err, suc } from "$lib/utils/result.util";
import { Client } from "./index.client";

const set_active_inner = async (organizationId: string) => {
  const res = await BetterAuthClient.organization.setActive({
    organizationId,
  });

  if (res.data) {
    return suc(res.data);
  } else {
    console.warn("Failed to set active organization:", res.error);
    return err(
      res.error?.message ??
        "Failed to set active organization. Please try again.",
    );
  }
};

export const OrganizationsClient = {
  set_active: (organizationId: string) =>
    Client.request(() => set_active_inner(organizationId), {
      toast: { suc: "Active organization updated." },
    }),

  delete: (organizationId: string) =>
    Client.request(
      async () => {
        if (
          !confirm(
            "Are you sure you want to delete this organization? This action cannot be undone.",
          )
        ) {
          return err();
        }

        const res = await BetterAuthClient.organization.delete({
          organizationId,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn("Failed to delete organization:", res.error);
          return err(
            res.error?.message ??
              "Failed to delete organization. Please try again.",
          );
        }
      },
      { toast: { suc: "Organization deleted successfully." } },
    ),

  accept_invitation: (invitationId: string) =>
    Client.request(
      async () => {
        const res = await BetterAuthClient.organization.acceptInvitation({
          invitationId,
        });

        if (res.data) {
          const set_active_res = await set_active_inner(
            res.data.invitation.organizationId,
          );

          if (!set_active_res.ok) {
            return set_active_res;
          }

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
