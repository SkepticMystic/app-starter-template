<script lang="ts">
  import type { DialogRootProps } from "bits-ui";
  import DialogRoot from "../dialog/dialog-root.svelte";
  import DrawerRoot from "../drawer/drawer-root.svelte";
  import { useModal } from "./modal.svelte.js";

  let {
    open = $bindable(false),
    children,
    ...rest
  }: DialogRootProps = $props();

  const modal = useModal();
</script>

{#if modal.view === "desktop"}
  <DialogRoot
    bind:open
    {...rest}
  >
    {@render children?.()}
  </DialogRoot>
{:else}
  <DrawerRoot
    bind:open
    {...rest}
  >
    {@render children?.()}
  </DrawerRoot>
{/if}
