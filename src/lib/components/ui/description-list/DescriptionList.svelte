<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  let {
    columns = 1,
    children,
    class: klass,
  }: {
    /**
     * How many columns at full width. `1` for a detail page's sidebar, more in a card that
     * spans the page. Every count collapses to one column on a phone.
     */
    columns?: 1 | 2 | 3;
    /** `DescriptionItem`s. */
    children: Snippet;
    class?: ClassValue;
  } = $props();
</script>

<!-- A record's facts as label over value — every detail page's metadata, so they all read alike. -->
<dl
  class={[
    "grid gap-x-6 gap-y-4",
    columns === 2 && "sm:grid-cols-2",
    columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
    klass,
  ]}
>
  {@render children()}
</dl>
