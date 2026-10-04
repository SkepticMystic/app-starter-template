<script lang="ts">
  import ButtonGroup from "#lib/components/ui/button-group/button-group.svelte";
  import { SIDEBAR_KEYBOARD_SHORTCUT } from "#lib/components/ui/sidebar/constants.js";
  import SidebarTrigger from "#lib/components/ui/sidebar/sidebar-trigger.svelte";
  import Tip from "#lib/components/ui/tooltip/Tip.svelte";
  import { chord_label } from "#lib/utils/keyboard.util.js";
  import { apple_keyboard } from "#lib/utils/keyboard.util.svelte.js";
  import ThemeSelector from "./ThemeSelector.svelte";

  // The sidebar's window shortcut takes either modifier: `aria-keyshortcuts` spells both, the
  // tip draws the one this keyboard would press.
  const TOGGLE_KEY = SIDEBAR_KEYBOARD_SHORTCUT.toUpperCase();
  const apple = apple_keyboard();
  const toggle_keys = $derived(
    chord_label({ mod: true, key: TOGGLE_KEY }, apple.current),
  );
</script>

<!-- The same width and gutters as `<main>`, so the toggle lines up with the page's left edge. -->
<nav
  class="
    mx-auto flex h-14 max-w-7xl items-center justify-between px-2
    sm:px-3
    md:px-5
  "
>
  <ButtonGroup>
    <Tip
      content="Toggle sidebar"
      kbd={toggle_keys}
      names_trigger
    >
      {#snippet child({ props })}
        <SidebarTrigger
          {...props}
          aria-keyshortcuts="Control+{TOGGLE_KEY} Meta+{TOGGLE_KEY}"
        />
      {/snippet}
    </Tip>
  </ButtonGroup>

  <ButtonGroup>
    <ThemeSelector />
  </ButtonGroup>
</nav>
