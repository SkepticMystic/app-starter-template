import { BetterAuthClient } from "$lib/auth-client";
import { BetterAuth } from "$lib/utils/better-auth.util";
import { Effect, pipe } from "effect";
import { Client } from "../index.client";

const set_active_inner = (organizationId: string | undefined) =>
  Effect.runPromise(
    pipe(
      Effect.sync(() =>
        organizationId
          ? Effect.succeed(organizationId)
          : Effect.fail({ message: "No organization ID provided." }),
      ),

      Effect.flatMap((e) => e),
      Effect.andThen((organizationId) =>
        BetterAuthClient.organization.setActive({ organizationId }),
      ),
      Effect.andThen((r) => BetterAuth.to_result(r)),
      Effect.tap((r) => r.ok && location.reload()),
    ),
  );

export const OrganizationClient = {
  set_active: (organizationId: string | undefined) =>
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
};
