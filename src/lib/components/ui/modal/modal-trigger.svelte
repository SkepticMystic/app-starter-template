<script lang="ts">
  import type { DialogTriggerProps } from "bits-ui";
  import DialogTrigger from "../dialog/dialog-trigger.svelte";
  import DrawerTrigger from "../drawer/drawer-trigger.svelte";
  import { useModalSub } from "./modal.svelte.js";

  const modal = useModalSub();

  let {
    ref = $bindable(null),
    children,
    ...rest
  }: DialogTriggerProps = $props();
</script>

{#if modal.view === "desktop"}
  <DialogTrigger
    bind:ref
    {...rest}
  >
    {@render children?.()}
  </DialogTrigger>
{:else}
  <DrawerTrigger
    bind:ref
    {...rest}
  >
    {@render children?.()}
  </DrawerTrigger>
{/if}
