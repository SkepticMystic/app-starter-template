import type { ResolvedPathname } from "$app/types";
import { redirect_uri_schema } from "#lib/schema/auth/redirect_uri.schema.js";
import { SEOUtil } from "#lib/utils/seo/seo.util.js";
import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load = (async ({ url, parent }) => {
  // Parsed here as on `/auth/signin`: the value is posted back to the remote,
  // and an unchecked one would be an open redirect.
  const raw = url.searchParams.get("redirect_uri");
  const redirect_uri = redirect_uri_schema().parse(
    raw ?? undefined,
  ) as ResolvedPathname;

  const { user } = await parent();
  if (user) redirect(302, redirect_uri);

  return {
    // `explicit` is forwarded back to `/auth/signin`, which has its own default.
    search: { redirect_uri, explicit: raw === null ? undefined : redirect_uri },
    seo: {
      ...SEOUtil.transform({ title: "Sign in with a code" }),
      robots: "noindex,nofollow",
    },
  };
}) satisfies PageLoad;
