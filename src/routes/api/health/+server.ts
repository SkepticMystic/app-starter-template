import { HealthService } from "#lib/server/services/health/health.service.js";
import type { RequestHandler } from "./$types";

/**
 * Readiness: `200` when Postgres and Redis answer, `503` when not (see
 * `health.service.ts`). Unauthenticated, since probes hold no credential, and
 * not rate-limited, since every limiter is an Upstash round trip. `no-store`,
 * because a cached health check is a lie. Dropped from Sentry tracing in
 * `instrumentation.server.ts`, so a probe every few seconds costs no quota.
 */
export const GET: RequestHandler = async () => {
  const health = await HealthService.check();

  return Response.json(health, {
    status: health.ok ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
};
