import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import type { PageLoad } from "./$types";

export const load = (() => ({
  seo: {
    ...SEOUtil.transform({ title: "Account deleted" }),
    robots: "noindex,nofollow",
  },
})) satisfies PageLoad;
