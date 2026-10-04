import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import type { PageLoad } from "./$types";

export const load = (() => ({
  seo: SEOUtil.transform({
    title: "Contact us",
    description: "Get in touch with the team.",
  }),
})) satisfies PageLoad;
