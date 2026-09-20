import { env as private_env } from "$env/dynamic/private";
import { building, dev } from "$app/environment";
import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import { auth } from "$lib/auth";
import * as Sentry from "@sentry/sveltekit";
import type { Handle, HandleValidationError } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";

/**
 * Secrets moved from `$env/static/private` to `$env/dynamic/private` so that no
 * credential is compiled into the server bundle — a built image can be pulled
 * by anyone with registry access, and rotating a key should not mean rebuilding.
 *
 * The cost is that a missing variable used to fail the build and would now fail
 * at first use instead, possibly months later inside `EmailService.send`. This
 * runs once at module load, which puts the failure back at a moment someone is
 * watching.
 *
 * It lives here rather than in `instrumentation.server.ts` because the
 * instrumentation hook runs BEFORE SvelteKit populates `$env/dynamic/private`,
 * so every variable reads as missing there.
 *
 * Only variables whose absence is unambiguously a misconfiguration. The OAuth
 * providers are deliberately absent: `auth.ts` registers Google and Pocket ID
 * only when their credentials are set, so empty is a valid configuration.
 *
 * This cannot be the FIRST thing that fails. Imports evaluate before the
 * importing module's body, so a variable whose SDK throws at construction --
 * `DATABASE_URL`, via `neon()` in `drizzle.db.ts` -- surfaces its own error
 * first. That error is clear enough ("No database connection string was
 * provided to `neon()`"); this list catches everything that would otherwise
 * fail silently much later.
 */
const REQUIRED = [
  "BETTER_AUTH_SECRET",
  "CAPTCHA_SECRET_KEY",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "DATABASE_URL",
  "EMAIL_FROM",
  "OPENAI_API_KEY",
  "PAYSTACK_SECRET_KEY",
  "R2_ACCESS_KEY_ID",
  "R2_BUCKET_NAME",
  "R2_SECRET_ACCESS_KEY",
  "RESEND_API_KEY",
  "UPSTASH_REDIS_REST_TOKEN",
  "UPSTASH_REDIS_REST_URL",
];

const missing = REQUIRED.filter((key) => !private_env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}. ` +
      `See .env.example for the full list.`,
  );
}

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

export const handle = sequence(
  Sentry.sentryHandle(),
  async ({ event, resolve }) => {
    return svelteKitHandler({ event, resolve, auth, building });
  },
  handleSecurityHeaders,
);
