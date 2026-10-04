import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import type { PageLoad } from "./$types";

export const load = (() => ({
  seo: SEOUtil.transform({
    title: "Terms of service",
    description: "The terms that govern your use of the service.",
  }),
})) satisfies PageLoad;
