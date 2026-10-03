import { read_session } from "#lib/server/services/auth.service.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import type { LayoutServerLoad } from "./$types";

/**
 * The signed-in user and the session's org-scoped fields, on `page.data` for every route, so a
 * component need not read `BetterAuthClient.useSession()` — empty during SSR, so the sidebar's
 * name and the marketing nav's "Home" painted blank or wrong until hydration, and stale after a
 * server-side change (see `permission.util.ts`).
 *
 * `depends("app:session")`: a client that changes the session (`set_active`, a profile update)
 * calls `invalidate("app:session")` rather than reloading. A plain `goto` does not re-run this.
 */
export const load = (async (event) => {
  event.depends("app:session");

  // A failed lookup renders signed-out rather than taking down every page, public ones included;
  // every gate asks again for itself.
  const read = await read_session().catch((error: unknown) => {
    Log.error(error, "root_layout.read_session");
    return null;
  });
  const session = read ? result.unwrap_or(read, null) : null;

  // Annotated: Better-Auth's inferred type drops the `additionalFields` from `auth.ts`, which
  // `app.d.ts` names.
  const fields: Partial<App.Session["session"]> = session?.session ?? {};

  return {
    user: session
      ? {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? null,
          // Cosmetic, like `org`: every `/admin` load asks `get_session({ admin: true })` itself.
          is_admin: session.user.role === "admin",
          is_impersonating: Boolean(fields.impersonatedBy),
        }
      : null,

    // A narrow slice: `session.token` must never be serialised into the HTML.
    org: fields.org_id
      ? { id: fields.org_id, role: fields.member_role ?? null }
      : null,
  };
}) satisfies LayoutServerLoad;
