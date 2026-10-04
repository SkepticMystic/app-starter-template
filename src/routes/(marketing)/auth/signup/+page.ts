import type { ResolvedPathname } from "$app/types";
import { safe_redirect_uri } from "#lib/utils/auth/redirect_uri.util.js";
import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load = (async ({ url, parent }) => {
  const raw = url.searchParams.get("redirect_uri");

  // `null` lets each method pick its own default: `/home` for a returning
  // OAuth user, `/onboarding` for a new one.
  const redirect_uri = raw
    ? (safe_redirect_uri(raw) as ResolvedPathname)
    : null;

  const { user } = await parent();
  if (user) redirect(302, redirect_uri ?? "/home");

  return {
    search: { redirect_uri },
    seo: SEOUtil.transform({ title: "Sign up" }),
  };
}) satisfies PageLoad;
