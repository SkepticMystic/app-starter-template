import { db } from "$lib/server/db/drizzle.db";
import { redis } from "$lib/server/db/redis.db";
import { BackgroundService } from "$lib/server/services/background/background.service";
import { json, type RequestHandler } from "@sveltejs/kit";
import { sql } from "drizzle-orm";

export const prerender = false;

const PROBE_TIMEOUT_MS = 2_000;

/** Probes cost a real query; a poller every second must not become load. */
const CACHE_MS = 5_000;

let cached:
  | { at: number; ok: boolean; body: Record<string, unknown> }
  | undefined;

const probe = async (name: string, work: Promise<unknown>) => {
  const timeout = new Promise<never>((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`${name} timed out`));
    }, PROBE_TIMEOUT_MS).unref();
  });

  try {
    await Promise.race([work, timeout]);

    return [name, "ok"] as const;
  } catch (error) {
    return [name, error instanceof Error ? error.message : "failed"] as const;
  }
};

/**
 * Readiness, for humans and for a deploy gate — never for anything that
 * restarts or depools the container. See `/healthz` for why that separation
 * matters.
 *
 * Postgres and Redis are deliberately the entire list: sessions are Redis-only
 * and every route reads them, so the app genuinely cannot serve a page without
 * both. Cloudinary, Resend, Paystack, OpenAI and R2 are per-feature and are
 * excluded on purpose — "not ready" must not mean "one optional integration is
 * having a bad day".
 */
export const GET: RequestHandler = async () => {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return json(cached.body, {
      status: cached.ok ? 200 : 503,
      headers: { "cache-control": "no-store" },
    });
  }

  const checks = Object.fromEntries(
    await Promise.all([
      probe("postgres", db.execute(sql`select 1`)),
      probe("redis", redis.ping()),
    ]),
  );

  const ok = Object.values(checks).every((value) => value === "ok");

  const body = {
    status: ok ? "ready" : "degraded",
    checks,
    background: BackgroundService.pending(),
  };

  cached = { at: Date.now(), ok, body };

  return json(body, {
    status: ok ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
};
