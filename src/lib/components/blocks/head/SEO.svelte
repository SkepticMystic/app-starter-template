<script lang="ts">
  import { page } from "$app/state";
  import { deepMerge, MetaTags } from "svelte-meta-tags";

  // Signed-in pages are named by their `Header` (`head_title`), which knows the entity on screen;
  // emitting a title here too would leave two `<title>`s. Nor are they for search engines.
  const signed_in = $derived(page.route.id?.startsWith("/(authed)") ?? false);

  let metatags = $derived.by(() => {
    const merged = deepMerge(page.data.base_seo, page.data.seo);

    return signed_in
      ? { ...merged, title: undefined, robots: "noindex,nofollow" }
      : merged;
  });
</script>

<MetaTags {...metatags} />
