<script lang="ts">
  import type { WithElementRef } from "bits-ui";
  import type { HTMLAttributes } from "svelte/elements";
  import DialogFooter from "../dialog/dialog-footer.svelte";
  import DrawerFooter from "../drawer/drawer-footer.svelte";
  import { useModalSub } from "./modal.svelte.js";

  const modal = useModalSub();

  let {
    ref = $bindable(null),
    children,
    ...rest
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

{#if modal.view === "desktop"}
  <DialogFooter
    bind:ref
    {...rest}
  >
    {@render children?.()}
  </DialogFooter>
{:else}
  <DrawerFooter
    bind:ref
    {...rest}
  >
    {@render children?.()}
  </DrawerFooter>
{/if}
