import { page } from "$app/state";
import type { OrgPermissions } from "#lib/const/auth/organization_access_control.const.js";
import { Authz } from "./authz.util";

/**
 * The client's side of {@link Authz}, asked of `page.data.org` — the role the
 * server's `get_session` read fresh for this page. Cosmetic only: the decision
 * is the server's. Do not gate UI off `BetterAuthClient.useActiveMember()` /
 * `useSession()`, which are empty during SSR and stale after a server-side
 * change.
 *
 * `org` comes from the root layout's server load, so every page has it.
 */
export const can = (permissions: OrgPermissions): boolean =>
  Authz.can({ org: page.data.org ?? null }, permissions);
