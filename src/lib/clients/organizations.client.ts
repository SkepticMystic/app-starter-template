import { BetterAuthClient } from "$lib/auth-client";
import { BetterAuth } from "$lib/utils/better-auth.util";
import { err } from "$lib/utils/result.util";
import { Effect, pipe } from "effect";
import { Client } from "./index.client";

const set_active_inner = async (organizationId: string) =>
  Effect.runPromise(
    pipe(
      Effect.promise(() =>
        BetterAuthClient.organization.setActive({ organizationId }),
      ),
      Effect.andThen((r) =>
        BetterAuth.to_result(r, {
          fallback: "Failed to set active organization.",
        }),
      ),
      Effect.tap(
        (r) => r.ok && BetterAuthClient.$store.notify("$sessionSignal"),
      ),
    ),
  );

export const OrganizationsClient = {
  set_active: (organizationId: string) =>
    Client.request(() => set_active_inner(organizationId), {
      toast: {
        loading: "Setting active organization...",
        success: "Active organization updated.",
      },
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

        return BetterAuthClient.organization
          .delete({ organizationId })
          .then(BetterAuth.to_result);
      },
      {
        toast: {
          loading: "Deleting organization...",
          success: "Organization deleted successfully.",
        },
      },
    ),

  accept_invitation: (invitationId: string) =>
    Client.request(
      async () => {
        const accept_res = await BetterAuth.to_result(
          BetterAuthClient.organization.acceptInvitation({ invitationId }),
          { fallback: "Failed to accept invitation." },
        );

        if (accept_res.ok) {
          const set_active_res = await set_active_inner(
            accept_res.data.invitation.organizationId,
          );

          if (!set_active_res.ok) {
            return set_active_res;
          }
        }

        return accept_res;
      },
      {
        toast: {
          loading: "Accepting invitation...",
          success: "Invitation accepted successfully.",
        },
      },
    ),

  cancel_invitation: (invitation_id: string) =>
    Client.request(
      async () => {
        if (!confirm("Are you sure you want to cancel this invitation?")) {
          return err();
        }

        return BetterAuth.to_result(
          BetterAuthClient.organization.cancelInvitation({
            invitationId: invitation_id,
          }),
          { fallback: "Failed to cancel invitation." },
        );
      },
      {
        toast: {
          loading: "Cancelling invitation...",
          success: "Invitation cancelled successfully.",
        },
      },
    ),
};
