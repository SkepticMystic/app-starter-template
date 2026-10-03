<script
  lang="ts"
  module
>
  import type { MaybeSnippet } from "#lib/interfaces/svelte/svelte.type.js";

  export type Crumb = { href: string; label: MaybeSnippet };
</script>

<script lang="ts">
  import ExtractSnippet from "#lib/components/util/ExtractSnippet.svelte";
  import type { ClassValue } from "svelte/elements";
  import BreadcrumbItem from "./breadcrumb-item.svelte";
  import BreadcrumbLink from "./breadcrumb-link.svelte";
  import BreadcrumbList from "./breadcrumb-list.svelte";
  import BreadcrumbRoot from "./breadcrumb-root.svelte";
  import BreadcrumbSeparator from "./breadcrumb-separator.svelte";

  /**
   * The way up from a deep page, every level of it: Tasks › that task. Ancestors only —
   * the page's own `h1` is the leaf, so there is no `BreadcrumbPage` here to say it twice.
   * A long label (a URL, a long name) truncates, with the whole of it in `title`.
   */

  let {
    crumbs,
    class: klass,
  }: {
    crumbs: readonly Crumb[];
    class?: ClassValue;
  } = $props();
</script>

<BreadcrumbRoot class={klass}>
  <BreadcrumbList>
    {#each crumbs as crumb, i (crumb.href)}
      {#if i > 0}
        <BreadcrumbSeparator />
      {/if}

      <BreadcrumbItem>
        <BreadcrumbLink
          href={crumb.href}
          class="max-w-56 truncate"
          title={typeof crumb.label === "string" ? crumb.label : undefined}
        >
          <ExtractSnippet snippet={crumb.label} />
        </BreadcrumbLink>
      </BreadcrumbItem>
    {/each}
  </BreadcrumbList>
</BreadcrumbRoot>
