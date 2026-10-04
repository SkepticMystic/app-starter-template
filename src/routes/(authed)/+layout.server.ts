import { SIDEBAR_COOKIE_NAME } from "#lib/components/ui/sidebar/constants.js";
import { App } from "#lib/utils/app.js";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load = (async ({ cookies, parent, url, untrack }) => {
  // The root load has already read the session; a signed-out visitor goes to
  // sign in and comes back. Each page's own `get_session` still authorizes.
  const { user } = await parent();
  if (!user) {
    // Untracked, so this load does not re-run on every in-app navigation.
    const redirect_uri = untrack(() => url.pathname + url.search);
    redirect(302, App.url("/auth/signin", { redirect_uri }));
  }

  // `sidebar-provider.svelte` writes this cookie on every toggle; reading it here is what lets
  // the server render a collapsed sidebar collapsed, instead of open until hydration.
  const sidebar_open = cookies.get(SIDEBAR_COOKIE_NAME) !== "false";

  return { sidebar_open };
}) satisfies LayoutServerLoad;
