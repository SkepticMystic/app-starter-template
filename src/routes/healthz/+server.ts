import { json, type RequestHandler } from "@sveltejs/kit";

/**
 * LIVENESS ONLY. It deliberately touches nothing: no Postgres, no Redis, no
 * Cloudinary, no Resend, no auth.
 *
 * This is what the container healthcheck and the reverse proxy's upstream
 * check read, and both react to a failure by taking the container OUT OF
 * SERVICE. Anything checked here therefore becomes a dependency that can take
 * the whole site down — a Neon compute that merely autosuspended is not a
 * reason to restart a healthy process, and Cloudinary having a bad day is not
 * a reason to stop serving the pages that never touch it.
 *
 * The question this answers is exactly "is this process alive and able to
 * route a request". Dependency checks live at `/readyz`, which nothing
 * automated acts on.
 */
export const prerender = false;

export const GET: RequestHandler = () =>
  json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
