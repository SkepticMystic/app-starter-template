import type { ResolvedPathname } from "$app/types";
import type { PageLoad } from "./$types";

export const load = (({ url }) => {
  const search = {
    redirect_uri: (url.searchParams.get("redirect_uri") ??
      "/onboarding") as ResolvedPathname,
  };

  return {
    search,
  };
}) satisfies PageLoad;
