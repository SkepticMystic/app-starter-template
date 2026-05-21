<script lang="ts">
  import { type WithElementRef } from "$lib/utils/shadcn.util.js";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { badgeVariants, type BadgeVariant } from ".";

  let {
    ref = $bindable(null),
    href,
    class: className,
    variant = "default",
    children,
    content,
    ...restProps
  }: WithElementRef<HTMLAnchorAttributes> & {
    variant?: BadgeVariant;
    content?: string;
  } = $props();
</script>

<svelte:element
  this={href ? "a" : "span"}
  bind:this={ref}
  data-slot="badge"
  {href}
  class={[badgeVariants({ variant }), className]}
  {...restProps}
>
  {#if children}
    {@render children()}
  {:else if content}
    {content}
  {/if}
</svelte:element>
