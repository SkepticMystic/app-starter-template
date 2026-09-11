import { building, dev } from "$app/env";
import { PUBLIC_BASE_URL, PUBLIC_SENTRY_DSN } from "$app/env/public";
import { auth } from "$lib/auth";
import { db_close } from "$lib/server/db/drizzle.db";
import { BackgroundService } from "$lib/server/services/background/background.service";
import { Log } from "$lib/utils/logger.util";
import * as Sentry from "@sentry/sveltekit";
import type { Handle, HandleValidationError, ServerInit } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";

// Used by remote function zod schemas
export const handleValidationError: HandleValidationError = ({
  // event,
  issues,
}) => {
  return {
    level: "warning",
    path: issues.at(0)?.path,
    message: issues.at(0)?.message || "Invalid input",
  };
};
export const handleError = Sentry.handleErrorWithSentry();

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

let shutting_down = false;

/**
 * Ordering is the whole point: finish the work first, then close the things
 * the work needs. Closing the pool before draining would fail every in-flight
 * background write with "Cannot use a pool after calling end".
 */
const shutdown = async (reason: string) => {
  if (shutting_down) return;
  shutting_down = true;

  Log.info({ reason, pending: BackgroundService.pending() }, "shutdown.start");

  await BackgroundService.drain();
  await db_close();
  await Sentry.close(2_000);

  Log.info("shutdown.done");
};

/**
 * Runs after `set_env`, before the first request, exactly once — `Server.init`
 * awaits it and adapter-node top-level-awaits `Server.init`, so anything
 * thrown here exits the process before the port is bound.
 */
export const init: ServerInit = () => {
  /**
   * `ORIGIN` is adapter-node's and `PUBLIC_BASE_URL` is the app's, and nothing
   * keeps them in step. A mismatch does not fail loudly — SvelteKit's CSRF
   * check rejects every form POST while every page still renders perfectly,
   * and every absolute URL in an email points at the wrong host. Both are
   * worth a boot failure rather than a support ticket.
   */
  const origin = process.env.ORIGIN;

  if (!building && origin !== PUBLIC_BASE_URL) {
    throw new Error(
      `ORIGIN (${origin ?? "unset"}) must equal PUBLIC_BASE_URL (${PUBLIC_BASE_URL})`,
    );
  }

  /**
   * adapter-node emits this from `httpServer.close()`'s callback — after the
   * last response has gone out — and never calls `process.exit()`. The process
   * exits when the event loop empties, so the pending work below is what keeps
   * it alive long enough to finish, and `db_close` is what stops idle pool
   * sockets keeping it alive forever.
   */
  process.on("sveltekit:shutdown", (reason: unknown) => {
    void shutdown(String(reason));
  });
};

export const handle = sequence(
  Sentry.sentryHandle(),
  async ({ event, resolve }) => {
    return svelteKitHandler({ event, resolve, auth, building });
  },
  handleSecurityHeaders,
);
