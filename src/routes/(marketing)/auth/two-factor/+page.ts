import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import type { PageLoad } from "./$types";

export const load = (() => ({
  seo: {
    ...SEOUtil.transform({ title: "Two-factor check" }),
    robots: "noindex,nofollow",
  },
})) satisfies PageLoad;
