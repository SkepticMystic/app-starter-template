<script lang="ts">
  import type { DialogDescriptionProps } from "bits-ui";
  import DialogDescription from "../dialog/dialog-description.svelte";
  import DrawerDescription from "../drawer/drawer-description.svelte";
  import { useModalSub } from "./modal.svelte.js";

  const modal = useModalSub();

  let { ref = $bindable(null), ...rest }: DialogDescriptionProps = $props();
</script>

{#if modal.view === "desktop"}
  <DialogDescription
    bind:ref
    {...rest}
  />
{:else}
  <DrawerDescription
    bind:ref
    {...rest}
  />
{/if}
