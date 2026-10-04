import { getRequestEvent } from "$app/server";
import { auth } from "#lib/auth.js";
import { ERROR } from "#lib/const/error.const.js";
import { OrganizationRepo } from "#lib/server/db/repos/organization.repo.js";
import { Authz } from "#lib/utils/auth/authz.util.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException, metrics, setUser } from "@sentry/sveltekit";
import { APIError } from "better-auth";

const log = Log.child({ service: "Auth" });

/** What a session gate asks for — see {@link Authz.Requirement}. */
export type GetSessionOptions = Authz.Requirement;

const DENIAL_METRIC: Record<Authz.Denial, string> = {
  email_unverified: "auth_email_unverified",
  not_admin: "auth_admin_forbidden",
  no_user_role: "auth_permissions_no_role",
  user_role: "auth_permissions_forbidden",
  no_org: "auth_org_no_org",
  no_org_role: "auth_org_no_member_role",
  org_role: "auth_org_permissions_forbidden",
};

/** A session, as {@link Authz} reads a subject. Trusts the org fields: pass only what `read_session` produced. */
const subject_of = (session: App.Session): Authz.Subject => ({
  user_role: session.user.role ?? null,
  email_verified: session.user.emailVerified,
  org: session.session.org_id
    ? { role: session.session.member_role ?? null }
    : null,
});

const authorize = (
  session: App.Session | null,
  options?: GetSessionOptions,
): App.Result<undefined> => {
  if (!session) return result.err(ERROR.UNAUTHORIZED);

  const denial = Authz.deny(subject_of(session), options);
  if (!denial) return result.suc(undefined);

  metrics.count(DENIAL_METRIC[denial], 1, {
    attributes: {
      user_id: session.user.id,
      ...(session.session.org_id && { org_id: session.session.org_id }),
    },
  });

  return result.err(
    denial === "email_unverified"
      ? { ...ERROR.FORBIDDEN, message: "Email not verified" }
      : ERROR.FORBIDDEN,
  );
};

export const authorize_event = (
  options?: GetSessionOptions,
): App.Result<undefined> => {
  const event = getRequestEvent();

  const session = event.locals.session ?? null;
  const check = authorize(session, options);

  return check;
};

/**
 * One session read per GET, shared by the page load and its queries. GET only:
 * a write may read again in the same request and must see its own write (a
 * role change, a switched org). Keyed on the `Request`, so it is collected
 * with it.
 */
const reads = new WeakMap<Request, Promise<App.Result<App.Session | null>>>();

const load_session = async (
  request: Request,
): Promise<App.Result<App.Session | null>> => {
  const session: App.Session | null = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) return result.suc(null);

  const org_id = session.session.org_id;
  if (!org_id) return result.suc(session);

  const membership = await OrganizationRepo.get_membership({
    org_id,
    user_id: session.user.id,
  });
  if (!membership.ok) return membership;

  const m = membership.data;

  if (!m) {
    log.info(
      { user_id: session.user.id, org_id },
      "read_session.membership_gone",
    );
  }

  Object.assign(session.session, {
    org_id: m ? org_id : null,
    member_id: m?.member_id ?? null,
    member_role: m?.role ?? null,
  });

  return result.suc(session);
};

/**
 * The request's session, or `null`; no authorization.
 *
 * Only `org_id` is trusted from the session. The member id and role are
 * re-read from the `member` table on every request: a session renews itself,
 * and the cookie cache hands back whatever was baked in up to `maxAge` ago, so
 * a demoted or removed member would otherwise keep their old grant. A gone
 * membership clears the org fields. Every session reader goes through here.
 */
export const read_session = async (): Promise<
  App.Result<App.Session | null>
> => {
  const { request } = getRequestEvent();

  if (request.method !== "GET") return load_session(request);

  const pending = reads.get(request) ?? load_session(request);
  reads.set(request, pending);

  return pending;
};

/**
 * The current session, or the refusal to return to the caller.
 *
 * It RETURNS; it does not redirect — the old wording said "Redirect to signin
 * if not logged in", and code written against that turned a signed-out caller
 * into an error page.
 *
 * The two refusals mean different things and want different handling:
 * - `UNAUTHORIZED` — there is no session at all. Safe to answer by sending the
 *   caller to sign in.
 * - `FORBIDDEN` — there is a session and it is not allowed to do this
 *   (unverified email, no member role, a failed permission check). Signing in
 *   again fixes none of these, so redirecting to sign-in is a loop.
 */
export const get_session = async (
  options?: GetSessionOptions,
): Promise<App.Result<App.Session>> => {
  try {
    const event = getRequestEvent();

    const read = await read_session();
    if (!read.ok) return read;

    const session = read.data;

    if (!session) {
      return result.err(ERROR.UNAUTHORIZED);
    }

    const check = authorize(session, options);
    if (!check.ok) return check;

    event.locals.session = session;

    // The id only: the email and name would ride along on every Sentry event.
    setUser({ id: session.user.id });

    return result.suc(session);
  } catch (error) {
    if (error instanceof APIError) {
      log.error(error.body, "get_session.error better-auth");

      // Same rule as `ba_error`: a refusal is an answer, not a fault.
      if (error.statusCode >= 500) captureException(error);

      return result.from_ba_error(error);
    } else {
      log.error(error, "get_session.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};
