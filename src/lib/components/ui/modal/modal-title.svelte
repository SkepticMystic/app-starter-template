<script lang="ts">
  import type { DialogTitleProps } from "bits-ui";
  import DialogTitle from "../dialog/dialog-title.svelte";
  import DrawerTitle from "../drawer/drawer-title.svelte";
  import { useModalSub } from "./modal.svelte.js";

  const modal = useModalSub();

  let { ref = $bindable(null), ...rest }: DialogTitleProps = $props();
</script>

{#if modal.view === "desktop"}
  <DialogTitle
    bind:ref
    {...rest}
  />
{:else}
  <DrawerTitle
    bind:ref
    {...rest}
  />
{/if}
