import { building, dev } from "$app/environment";
import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import { auth } from "$lib/auth";
import * as Sentry from "@sentry/sveltekit";
import type { Handle, HandleValidationError } from "@sveltejs/kit";
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
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // Restrict browser features your app doesn't need
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");

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

    response.headers.set("Reporting-Endpoints", `csp-endpoint="${SENTRY_CSP_URL}"`);
  }

  return response;
};

export const handle = sequence(
  Sentry.sentryHandle(),
  async function _handle({ event, resolve }) {
    return svelteKitHandler({ event, resolve, auth, building });
  },
  handleSecurityHeaders,
);
