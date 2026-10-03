<script lang="ts">
  import ExtractSnippet from "#lib/components/util/ExtractSnippet.svelte";
  import { APP } from "#lib/const/app.const.js";
  import type { MaybeSnippet } from "#lib/interfaces/svelte/svelte.type.js";
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import Anchor from "../anchor/Anchor.svelte";
  import Breadcrumb, { type Crumb } from "../breadcrumb/Breadcrumb.svelte";

  let {
    back,
    title,
    head_title,
    badges,
    level = 1,
    actions,
    description,
    class: klass,
  }: {
    class?: ClassValue;
    title: MaybeSnippet;
    /**
     * The browser tab's title, for a page header whose `title` is a snippet. A string `title`
     * is used as it is, so only those pages pass this.
     */
    head_title?: string;
    /** Status badges hung off the end of the title, inside the heading. */
    badges?: Snippet;
    /**
     * The heading element to render. `1` for a page's own header, `2` and below for a
     * `<section>` inside one — the levels are styled globally in `layout.css`.
     */
    level?: 1 | 2 | 3 | 4;
    /**
     * Where "up" is. Omitted on a top-level page, which has nowhere to go back to.
     *
     * One level is the arrow link it has always been. Two or more is the rest of "up" as a
     * breadcrumb, outermost first — the URL's hierarchy, not the browser's history — for a
     * page whose one-level "back" named only its nearest ancestor, with no word of the
     * levels above it. The tuple's minimum of two keeps one level the object form.
     */
    back?: Crumb | readonly [Crumb, Crumb, ...Crumb[]];
    description?: MaybeSnippet | null;
    /** Buttons and badges, laid out on the right and wrapping under the title when narrow. */
    actions?: Snippet;
  } = $props();

  // A page's own header names its tab; `SEO.svelte` leaves `<title>` to it on signed-in routes.
  const tab_title = $derived(
    level === 1
      ? (head_title ?? (typeof title === "string" ? title : undefined))
      : undefined,
  );
</script>

<svelte:head>
  {#if tab_title}
    <title>{tab_title} · {APP.NAME}</title>
  {/if}
</svelte:head>

<header class={["flex flex-wrap items-start justify-between gap-3", klass]}>
  <div>
    {#if back && "href" in back}
      <Anchor
        href={back.href}
        icon="lucide/arrow-left"
        content={back.label}
      />
    {:else if back}
      <Breadcrumb crumbs={back} />
    {/if}

    <!-- `flex` so `badges` hang off the end of the title. -->
    <svelte:element
      this={`h${level}`}
      class="flex flex-wrap items-center gap-2"
    >
      <ExtractSnippet snippet={title} />

      {@render badges?.()}
    </svelte:element>

    {#if description}
      <p class="text-sm text-muted-foreground">
        <ExtractSnippet snippet={description} />
      </p>
    {/if}
  </div>

  {#if actions}
    <div class="flex flex-wrap items-center gap-2">
      {@render actions()}
    </div>
  {/if}
</header>
