<script lang="ts">
  import { page } from "$app/state";
  import { deepMerge, MetaTags } from "svelte-meta-tags";

  let metatags = $derived(deepMerge(page.data.base_seo, page.data.seo));
</script>

<MetaTags {...metatags} />
