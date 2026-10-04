import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import type { EndpointCall } from "./audit_capture.js";

/**
 * The security log's capture point: hands every finished endpoint call to
 * `on_call` (`AuditService.after_endpoint`).
 *
 * A plugin rather than `hooks.after`, because the user's after-hook runs
 * before every plugin's, and this must run after `twoFactor`'s — which
 * withdraws the session a credential sign-in made while it still owes a second
 * factor. Plugin hooks run in `plugins` order, so list it after that one.
 */
export const audit_plugin = (on_call: (call: EndpointCall) => void) =>
  ({
    id: "audit",
    hooks: {
      after: [
        {
          matcher: () => true,
          handler: createAuthMiddleware(async (ctx) => {
            on_call({
              path: ctx.path,
              params: ctx.params,
              query: ctx.query,
              body: ctx.body,
              returned: ctx.context.returned,
              session: ctx.context.session,
              new_session: ctx.context.newSession,
            });
          }),
        },
      ],
    },
  }) satisfies BetterAuthPlugin;
