import { APP } from "$lib/const/app.const";
import type { RequestHandler } from "@sveltejs/kit";
import * as sitemap from "super-sitemap";

export const prerender = true;

export const GET: RequestHandler = async () => {
  //   const [tasks] = await Promise.all([
  //     db.query.task.findMany({
  //       columns: { id: true, updatedAt: true },
  //     }),
  //   ]);

  return await sitemap.response({
    origin: APP.URL,

    excludeRoutePatterns: ["^/admin", "^/tasks/\\[id\\]"],

    // paramValues: {
    //   "/tasks/[task_id]": tasks.map((task) => ({
    //     values: [task.id],
    //     lastmod: task.updatedAt?.toISOString().split("T")[0],
    //   })),
    // } satisfies Partial<Record<RouteId, sitemap.ParamValues[string]>>,
  });
};
