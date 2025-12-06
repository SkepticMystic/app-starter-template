<script lang="ts">
  import { resetMode, setMode } from "mode-watcher";
  import { buttonVariants } from "../ui/button/button.svelte";
  import DropdownMenuContent from "../ui/dropdown-menu/dropdown-menu-content.svelte";
  import DropdownMenuItem from "../ui/dropdown-menu/dropdown-menu-item.svelte";
  import DropdownMenuRoot from "../ui/dropdown-menu/dropdown-menu-root.svelte";
  import DropdownMenuTrigger from "../ui/dropdown-menu/dropdown-menu-trigger.svelte";
  import Icon from "../ui/icon/Icon.svelte";
</script>

<DropdownMenuRoot>
  <DropdownMenuTrigger
    class={buttonVariants({ variant: "outline", size: "icon" })}
  >
    <Icon
      icon="lucide/sun"
      class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:hidden dark:scale-0 dark:-rotate-90"
    />

    <Icon
      icon="lucide/moon"
      class="hidden h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:inline-block dark:scale-100 dark:rotate-0"
    />

    <span class="sr-only">Toggle theme</span>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    <DropdownMenuItem onclick={() => setMode("light")}>Light</DropdownMenuItem>
    <DropdownMenuItem onclick={() => setMode("dark")}>Dark</DropdownMenuItem>
    <DropdownMenuItem onclick={() => resetMode()}>System</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenuRoot>
