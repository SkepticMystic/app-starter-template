import type { PageLoad } from "./$types";

export const load = (async ({ url }) => {
  const search = {
    token: url.searchParams.get("token"),
    error: url.searchParams.get("error"),
  };

  return {
    search,
  };
}) satisfies PageLoad;
