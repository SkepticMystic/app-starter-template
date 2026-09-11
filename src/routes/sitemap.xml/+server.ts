import { APP } from "$lib/const/app.const";
import type { RequestHandler } from "@sveltejs/kit";
import * as sitemap from "super-sitemap";

/**
 * NOT prerendered.
 *
 * `APP.URL` is `PUBLIC_BASE_URL`, which is read at runtime now that one image
 * serves every tier. A prerendered page cannot contain a runtime value, so
 * prerendering this would bake in whatever the BUILD machine had and ship a
 * production sitemap full of `http://localhost:5173`.
 *
 * Rendering per request costs a few milliseconds for a handful of routes, and
 * the reverse proxy and CDN can cache the response.
 */
export const prerender = false;

export const GET: RequestHandler = async () => {
  //   const [tasks] = await Promise.all([
  //     db.query.task.findMany({
  //       columns: { id: true, updatedAt: true },
  //     }),
  //   ]);

  return await sitemap.response({
    origin: APP.URL,

    excludeRoutePatterns: [
      "^/admin",
      String.raw`^/\(authed\)/tasks/\[id\]`,
      // Operational endpoints; they are not content and must not be indexed.
      "^/healthz",
      "^/readyz",
    ],

    // paramValues: {
    //   "/tasks/[task_id]": tasks.map((task) => ({
    //     values: [task.id],
    //     lastmod: task.updatedAt?.toISOString().split("T")[0],
    //   })),
    // } satisfies Partial<Record<RouteId, sitemap.ParamValues[string]>>,
  });
};
