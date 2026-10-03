import { building, dev } from "$app/env";
import { PUBLIC_SENTRY_DSN } from "$app/env/public";
import { auth } from "#lib/auth.js";
import { AdapterService } from "#lib/server/services/adapter/adapter.service.js";
import { Log } from "#lib/utils/logger.util.js";
import * as Sentry from "@sentry/sveltekit";
import {
  sequence,
  type Handle,
  type HandleServerError,
} from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";

/**
 * SvelteKit 3 routes every error through here — expected `error(...)`s, 404s
 * and remote-function validation failures included — and Sentry's wrapper
 * decides by `kind` which of those are worth capturing.
 *
 * Passing a handler replaces Sentry's default one, which is what used to log
 * stack traces, so unexpected errors are logged here instead.
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

  if (input.kind === "unknown") {
    Log.error(input.error, "handle_error.unknown");
  }
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
    const env = dev ? "development" : "production";
    return `https://${url.host}/api/${projectId}/security/?sentry_key=${sentryKey}&sentry_environment=${env}`;
  } catch {
    return null;
  }
}

const SENTRY_CSP_URL = sentryCspReportUrl();

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
  }

  return response;
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
);
