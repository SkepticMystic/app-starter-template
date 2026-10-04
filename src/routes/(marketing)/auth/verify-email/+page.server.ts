import type { ResolvedPathname } from "$app/types";
import { get_session } from "#lib/server/services/auth.service.js";
import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session();

  if (session.ok && session.data.user.emailVerified) {
    redirect(302, "/home" satisfies ResolvedPathname);
  }

  return {
    seo: {
      ...SEOUtil.transform({ title: "Verify your email" }),
      robots: "noindex,nofollow",
    },
  };
}) satisfies PageServerLoad;
