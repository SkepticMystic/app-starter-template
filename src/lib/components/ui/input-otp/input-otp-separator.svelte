<script lang="ts">
  import type { WithElementRef } from "$lib/utils/shadcn.util.js";
  import type { HTMLAttributes } from "svelte/elements";
  import Icon from "../icon/Icon.svelte";

  let {
    ref = $bindable(null),
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="input-otp-separator"
  role="separator"
  {...restProps}
>
  {#if children}
    {@render children?.()}
  {:else}
    <Icon icon="lucide/dot" />
  {/if}
</div>
