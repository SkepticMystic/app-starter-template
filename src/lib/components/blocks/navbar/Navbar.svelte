<script lang="ts">
  import SidebarTrigger from "$lib/components/ui/sidebar/sidebar-trigger.svelte";
  import ButtonGroup from "../../ui/button-group/button-group.svelte";
  import ThemeSelector from "./ThemeSelector.svelte";
</script>

<nav class="mx-auto flex h-16 max-w-5xl items-center justify-between px-3">
  <ButtonGroup>
    <SidebarTrigger />
  </ButtonGroup>

  <ButtonGroup>
    <ThemeSelector />
  </ButtonGroup>
</nav>
