<script lang="ts">
  import type { DialogContentProps } from "bits-ui";
  import DialogContent from "../dialog/dialog-content.svelte";
  import DrawerContent from "../drawer/drawer-content.svelte";
  import { useModalSub } from "./modal.svelte.js";

  const modal = useModalSub();

  let {
    ref = $bindable(null),
    hideClose = false,
    children,
    ...rest
  }: DialogContentProps & { hideClose?: boolean } = $props();
</script>

{#if modal.view === "desktop"}
  <DialogContent
    bind:ref
    {...rest}
    {hideClose}
  >
    {@render children?.()}
  </DialogContent>
{:else}
  <DrawerContent
    bind:ref
    {...rest}
  >
    {@render children?.()}
  </DrawerContent>
{/if}
