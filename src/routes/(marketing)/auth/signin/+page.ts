import type { ResolvedPathname } from "$app/types";
import { safe_redirect_uri } from "#lib/utils/auth/redirect_uri.util.js";
import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load = (async ({ url, parent, data }) => {
  // Parsed here, not just on the server, because the passkey button follows it
  // from the browser: an unchecked value is an open redirect.
  const raw = url.searchParams.get("redirect_uri");
  const redirect_uri = safe_redirect_uri(raw) as ResolvedPathname;

  const { user } = await parent();
  if (user) redirect(302, redirect_uri);

  return {
    ...data,
    // `explicit` is forwarded to sign-up, which has its own defaults.
    search: { redirect_uri, explicit: raw === null ? undefined : redirect_uri },
    seo: SEOUtil.transform({ title: "Sign in" }),
  };
}) satisfies PageLoad;
