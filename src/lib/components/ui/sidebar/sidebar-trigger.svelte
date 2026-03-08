<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Button from "../button/button.svelte";
  import { useSidebar } from "./context.svelte.js";

  let {
    class: className,
    onclick,
    ...restProps
  }: ComponentProps<typeof Button> & {
    onclick?: (e: MouseEvent) => void;
  } = $props();

  const sidebar = useSidebar();
</script>

<Button
  data-sidebar="trigger"
  data-slot="sidebar-trigger"
  variant="ghost"
  size="icon"
  class={["size-7", className]}
  type="button"
  icon="lucide/panel-left"
  onclick={(e) => {
    onclick?.(e);
    sidebar.toggle();
  }}
  {...restProps}
>
  <span class="sr-only">Toggle Sidebar</span>
</Button>
