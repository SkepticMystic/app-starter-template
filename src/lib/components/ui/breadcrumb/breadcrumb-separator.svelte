<script lang="ts">
  import Icon from "../icon/Icon.svelte";
  import { type WithElementRef } from "#lib/utils/shadcn.util.js";
  import type { HTMLLiAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li
  bind:this={ref}
  data-slot="breadcrumb-separator"
  role="presentation"
  aria-hidden="true"
  class={["[&>svg]:size-3.5", className]}
  {...restProps}
>
  {#if children}
    {@render children?.()}
  {:else}
    <Icon
      icon="lucide/chevron-right"
      class="rtl:rotate-180"
    />
  {/if}
</li>
