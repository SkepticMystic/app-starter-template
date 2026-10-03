<script lang="ts">
  import { page } from "$app/state";
  import { error_copy } from "#lib/components/ui/error-state/ErrorState.svelte";
  import { deepMerge, MetaTags } from "svelte-meta-tags";

  // Signed-in pages are named by their `Header` (`head_title`), which knows the entity on screen;
  // emitting a title here too would leave two `<title>`s. Nor are they for search engines.
  const signed_in = $derived(page.route.id?.startsWith("/(authed)") ?? false);

  let metatags = $derived.by(() => {
    const merged = deepMerge(page.data.base_seo, page.data.seo);

    if (signed_in) {
      return { ...merged, title: undefined, robots: "noindex,nofollow" };
    }

    // An error page would otherwise wear the site's own title ("App · App"), and is not a page
    // to index either.
    if (page.error) {
      return {
        ...merged,
        title: error_copy(page.status, page.error.message).title,
        robots: "noindex,nofollow",
      };
    }

    return merged;
  });
</script>

<MetaTags {...metatags} />
