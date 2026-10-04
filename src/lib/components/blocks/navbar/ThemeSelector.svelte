<script lang="ts">
  import { buttonVariants } from "#lib/components/ui/button/button-root.svelte";
  import DropdownMenuContent from "#lib/components/ui/dropdown-menu/dropdown-menu-content.svelte";
  import DropdownMenuRadioGroup from "#lib/components/ui/dropdown-menu/dropdown-menu-radio-group.svelte";
  import DropdownMenuRadioItem from "#lib/components/ui/dropdown-menu/dropdown-menu-radio-item.svelte";
  import DropdownMenuRoot from "#lib/components/ui/dropdown-menu/dropdown-menu-root.svelte";
  import DropdownMenuTrigger from "#lib/components/ui/dropdown-menu/dropdown-menu-trigger.svelte";
  import Icon from "#lib/components/ui/icon/Icon.svelte";
  import { resetMode, setMode, userPrefersMode } from "mode-watcher";

  const set = (mode: string) => {
    if (mode === "light" || mode === "dark") setMode(mode);
    else resetMode();
  };
</script>

<DropdownMenuRoot>
  <DropdownMenuTrigger
    class={buttonVariants({ variant: "outline", size: "icon" })}
  >
    <Icon
      icon="lucide/sun"
      class="
        h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all!
        dark:hidden dark:scale-0 dark:-rotate-90
      "
    />

    <Icon
      icon="lucide/moon"
      class="
        hidden h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all!
        dark:inline-block dark:scale-100 dark:rotate-0
      "
    />

    <span class="sr-only">Toggle theme</span>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    <DropdownMenuRadioGroup bind:value={() => userPrefersMode.current, set}>
      <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenuRoot>
