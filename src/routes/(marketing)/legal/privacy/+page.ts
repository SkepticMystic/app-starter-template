import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import type { PageLoad } from "./$types";

export const load = (() => ({
  seo: SEOUtil.transform({
    title: "Privacy policy",
    description: "How we collect, use and protect your data.",
  }),
})) satisfies PageLoad;
