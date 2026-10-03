import { SIDEBAR_COOKIE_NAME } from "#lib/components/ui/sidebar/constants.js";
import type { LayoutServerLoad } from "./$types";

export const load = (({ cookies }) => {
  // `sidebar-provider.svelte` writes this cookie on every toggle; reading it here is what lets
  // the server render a collapsed sidebar collapsed, instead of open until hydration.
  const sidebar_open = cookies.get(SIDEBAR_COOKIE_NAME) !== "false";

  return { sidebar_open };
}) satisfies LayoutServerLoad;
