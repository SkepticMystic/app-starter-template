import { APP } from "$lib/const/app.const";
import { SEOUtil } from "$lib/utils/seo/seo.util";
import type { PageLoad } from "./$types";

export const load = (() => {
  return {
    // NOTE: fields here override the defaults in /+layout.ts (base_seo).
    // titleTemplate is "%s" so the homepage title is just APP.NAME, not
    // "App Starter | App Starter". Other pages inherit the templated form.
    seo: SEOUtil.transform({
      title: APP.NAME,
      titleTemplate: "%s",
      description: APP.DESCRIPTION,
    }),
  };
}) satisfies PageLoad;
