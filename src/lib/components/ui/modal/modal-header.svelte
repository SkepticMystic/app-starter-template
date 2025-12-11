<script lang="ts">
  import type { WithElementRef } from "bits-ui";
  import type { HTMLAttributes } from "svelte/elements";
  import DialogHeader from "../dialog/dialog-header.svelte";
  import DrawerHeader from "../drawer/drawer-header.svelte";
  import { useModalSub } from "./modal.svelte.js";

  const modal = useModalSub();

  let {
    ref = $bindable(null),
    children,
    ...rest
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

{#if modal.view === "desktop"}
  <DialogHeader
    bind:ref
    {...rest}
  >
    {@render children?.()}
  </DialogHeader>
{:else}
  <DrawerHeader
    bind:ref
    {...rest}
  >
    {@render children?.()}
  </DrawerHeader>
{/if}
