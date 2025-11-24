import { BetterAuthClient } from "$lib/auth-client";
import {
  cancel_invitation_remote,
  get_all_invitations_remote,
} from "$lib/remote/auth/invitation.remote";
import { BetterAuth } from "$lib/utils/better-auth.util";
import { Client } from "./index.client";

export const InvitationClient = {
  accept: (invitationId: string) =>
    Client.request(
      () =>
        BetterAuth.to_result(
          BetterAuthClient.organization.acceptInvitation({ invitationId }),
        ),
      { toast: { success: "Invitation accepted successfully." } },
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
};
