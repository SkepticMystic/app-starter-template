import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import type { PageLoad } from "./$types";

export const load = (async ({ url }) => {
  const search = {
    token: url.searchParams.get("token"),
    error: url.searchParams.get("error"),
  };

  return {
    search,
    seo: {
      ...SEOUtil.transform({ title: "Reset password" }),
      robots: "noindex,nofollow",
    },
  };
}) satisfies PageLoad;
