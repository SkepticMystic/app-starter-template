<script lang="ts">
  import ExtractSnippet from "$lib/components/util/ExtractSnippet.svelte";
  import type { MaybeSnippet } from "$lib/interfaces/svelte/svelte.types";
  import { cn, type WithElementRef } from "$lib/utils/shadcn.util";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import Icon from "../icon/Icon.svelte";
  import Loading from "../loading/Loading.svelte";

  let {
    href,
    icon,
    content,
    loading,
    disabled,
    children,
    class: klass,
    ref = $bindable(null),
    ...rest_props
  }: WithElementRef<HTMLAnchorAttributes> & {
    loading?: boolean;
    icon?: string | null;
    disabled?: boolean | null;
    content?: MaybeSnippet;
  } = $props();
</script>

<a
  aria-disabled={disabled || loading}
  href={disabled || loading ? undefined : href}
  role={disabled || loading ? "link" : undefined}
  tabindex={disabled || loading ? -1 : undefined}
  class={cn(
    // NOTE: Copied from buttonVariants.variant === 'link'
    // But we don't take the rest cause then it forces the `size` classes on us
    "inline-block underline underline-offset-4",
    // Mine
    "font-medium",
    // We call it something besides 'loading' cause daisy is clashing with it
    loading && "btn-loading",
    klass,
  )}
  bind:this={ref}
  {...rest_props}
>
  <span class="flex items-center gap-1.5">
    <Loading {loading} />

    <Icon {icon} />

    {#if children}
      {@render children()}
    {:else if content}
      <ExtractSnippet snippet={content} />
    {/if}
  </span>
</a>
