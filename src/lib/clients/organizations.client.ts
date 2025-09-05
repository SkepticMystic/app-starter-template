import { BetterAuthClient } from "$lib/auth-client";
import { BetterAuth } from "$lib/utils/better-auth.util";
import { Effect, pipe } from "effect";
import { Client } from "./index.client";

const set_active_inner = async (organizationId: string) =>
  Effect.runPromise(
    pipe(
      Effect.promise(() =>
        BetterAuth.to_result(
          BetterAuthClient.organization.setActive({ organizationId }),
        ),
      ),
      Effect.tap(
        (r) => r.ok && BetterAuthClient.$store.notify("$sessionSignal"),
      ),
    ),
  );

export const OrganizationsClient = {
  set_active: (organizationId: string) =>
    Client.request(() => set_active_inner(organizationId), {
      toast: { success: "Active organization updated." },
    }),

  delete: (organizationId: string) =>
    Client.better_auth(
      () => BetterAuthClient.organization.delete({ organizationId }),
      {
        confirm: "Are you sure you want to delete this organization?",
        toast: { success: "Organization deleted successfully." },
      },
    ),

  accept_invitation: (invitationId: string) =>
    Client.request(
      async () => {
        const accept_res = await BetterAuth.to_result(
          BetterAuthClient.organization.acceptInvitation({ invitationId }),
        );
        if (!accept_res.ok) return accept_res;

        const set_active_res = await set_active_inner(
          accept_res.data.invitation.organizationId,
        );
        if (!set_active_res.ok) return set_active_res;

        return accept_res;
      },
      { toast: { success: "Invitation accepted successfully." } },
    ),

  cancel_invitation: (invitationId: string) =>
    Client.better_auth(
      () => BetterAuthClient.organization.cancelInvitation({ invitationId }),
      {
        confirm: "Are you sure you want to cancel this invitation?",
        toast: { success: "Invitation cancelled successfully." },
      },
    ),
};
