import { building } from "$app/env";
import { APP_ENV } from "$app/env/private";
import { PUBLIC_SENTRY_DSN } from "$app/env/public";
import { auth } from "#lib/auth.js";
import { ERROR } from "#lib/const/error.const.js";
import { AdapterService } from "#lib/server/services/adapter/adapter.service.js";
import { Log } from "#lib/utils/logger.util.js";
import * as Sentry from "@sentry/sveltekit";
import {
  sequence,
  type Handle,
  type HandleServerError,
} from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { createInitialModeExpression } from "mode-watcher";

/**
 * SvelteKit 3 routes every error through here — expected `error(...)`s, 404s
 * and remote-function validation failures included — and Sentry's wrapper
 * decides by `kind` which of those are worth capturing.
 *
 * Passing a handler replaces Sentry's default one, which is what used to log
 * stack traces, so server errors are logged here instead: every 5xx, a thrown
 * `error(503, …)` as much as an unexpected throw, with the route it came from.
 * A 4xx is the caller's mistake and is not logged.
 */
const handle_error: HandleServerError = (input) => {
  // Used by remote function zod schemas
  if (input.kind === "validation") {
    return {
      level: "warning",
      path: input.issues.at(0)?.path,
      message: input.issues.at(0)?.message || "Invalid input",
    };
  }

  const status = input.kind === "unknown" ? 500 : input.error.status;

  if (status >= 500) {
    const { event } = input;

    Log.error(
      {
        // `err`, not `error`: pino serializes an Error only under `err`.
        err: input.error,
        kind: input.kind,
        status,
        path: event.url.pathname,
        route: event.route.id,
      },
      "handle_error",
    );
  }

  // Kit's defaults: the caught error's own status and message.
  return undefined;
};

export const handleError = Sentry.handleErrorWithSentry(handle_error);

// Derive Sentry's CSP-report ingest URL from the public DSN so violations
// reported by the browser show up in the same project.
function sentryCspReportUrl(): string | null {
  if (!PUBLIC_SENTRY_DSN) return null;
  try {
    const url = new URL(PUBLIC_SENTRY_DSN);
    const projectId = url.pathname.replace(/^\//, "");
    const sentryKey = url.username;
    if (!projectId || !sentryKey) return null;
    // The tier `Sentry.init` reports, so violations file beside the errors.
    const environment = encodeURIComponent(APP_ENV);
    return `https://${url.host}/api/${projectId}/security/?sentry_key=${sentryKey}&sentry_environment=${environment}`;
  } catch {
    return null;
  }
}

const SENTRY_CSP_URL = sentryCspReportUrl();

const CSP_HEADERS = [
  "content-security-policy",
  "content-security-policy-report-only",
] as const;

// SEO: Security headers improve trust signals and protect against common attacks.
const handleSecurityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Stop browsers from MIME-sniffing the content type
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control how much referrer info is sent
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Opt into browser XSS filtering (legacy, but cheap to add)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Only allow HTTPS connections going forward
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );

  // Restrict browser features your app doesn't need
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)",
  );

  if (SENTRY_CSP_URL) {
    // Report violations to Sentry
    response.headers.append(
      "Report-To",
      JSON.stringify({
        group: "csp-endpoint",
        max_age: 10886400,
        endpoints: [{ url: SENTRY_CSP_URL }],
        include_subdomains: true,
      }),
    );

    response.headers.set(
      "Reporting-Endpoints",
      `csp-endpoint="${SENTRY_CSP_URL}"`,
    );

    // Firefox reads only the legacy `report-uri` directive, not
    // `Reporting-Endpoints`. Appended to whichever policy kit emitted (none
    // until `kit.csp` is configured), unless it already names one.
    for (const name of CSP_HEADERS) {
      const policy = response.headers.get(name);
      if (policy && !policy.includes("report-uri")) {
        response.headers.set(name, `${policy}; report-uri ${SENTRY_CSP_URL}`);
      }
    }
  }

  return response;
};

const MODE_WATCHER_SNIPPET = createInitialModeExpression();

/**
 * Fills `%modewatcher.snippet%` in `app.html`, under kit's CSP nonce, which
 * `<svelte:head>` cannot reach — hence `disableHeadScriptInjection` on
 * `<ModeWatcher />`.
 */
const handleModeWatcher: Handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace("%modewatcher.snippet%", MODE_WATCHER_SNIPPET),
  });

/**
 * An `/api/*` caller reads JSON, but a 404 for a missing route, a 405 for a
 * missing verb, or any error kit answers before dispatch would otherwise get
 * kit's HTML error page. Only a non-JSON error is rewritten, so a route's own
 * JSON error passes through untouched.
 */
const handleApiErrorShape: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  if (!event.url.pathname.startsWith("/api/")) return response;
  if (response.ok) return response;
  if (response.headers.get("content-type")?.includes("application/json")) {
    return response;
  }

  const api_error: App.Error =
    response.status === 404
      ? { ...ERROR.NOT_FOUND, message: "No such endpoint" }
      : response.status === 405
        ? ERROR.METHOD_NOT_ALLOWED
        : {
            ...ERROR.INTERNAL_SERVER_ERROR,
            status: response.status,
            message: response.statusText || "Request failed",
          };

  const json = Response.json(
    { error: { code: api_error.code, message: api_error.message } },
    { status: api_error.status },
  );

  // `allow` tells a 405's caller which verbs would have worked.
  const allow = response.headers.get("allow");
  if (allow) json.headers.set("allow", allow);

  return json;
};

// @sentry/sveltekit's types still import `Handle` from `@sveltejs/kit`, which
// SvelteKit 3 moved to `@sveltejs/kit/hooks`, so its return type arrives
// unresolved. The runtime is unaffected; drop the cast once Sentry catches up.
const sentry_handle = Sentry.sentryHandle() as Handle;

export const handle = sequence(
  sentry_handle,
  async ({ event, resolve }) => {
    // Before anything reads the headers — see `CLIENT_IP_HEADER`.
    if (!building) AdapterService.pin_client_ip(event);

    return svelteKitHandler({ event, resolve, auth, building });
  },
  handleSecurityHeaders,
  handleModeWatcher,
  // Innermost: it replaces the response, discarding headers set by any
  // handler it wraps.
  handleApiErrorShape,
);
