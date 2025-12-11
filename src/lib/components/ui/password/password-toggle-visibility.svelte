<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util.js";
  import Icon from "../icon/Icon.svelte";
  import Toggle from "../toggle/toggle.svelte";
  import { usePasswordToggleVisibility } from "./password.svelte.js";
  import type { PasswordToggleVisibilityProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
  }: PasswordToggleVisibilityProps = $props();

  const state = usePasswordToggleVisibility();
</script>

<Toggle
  bind:ref
  aria-label={state.root.opts.hidden.current
    ? "Show password"
    : "Hide password"}
  bind:pressed={state.root.opts.hidden.current}
  class={cn(
    "absolute top-1/2 right-0 size-9 min-w-0 -translate-y-1/2 p-0 hover:!bg-transparent data-[state=off]:text-muted-foreground hover:data-[state=off]:text-accent-foreground data-[state=on]:bg-transparent data-[state=on]:text-muted-foreground hover:data-[state=on]:text-accent-foreground",
    {
      "right-9 max-w-6": state.root.passwordState.copyMounted,
    },
    className,
  )}
  tabindex={-1}
>
  {#if state.root.opts.hidden.current}
    <Icon
      icon="lucide/eye"
      class="size-4"
    />
  {:else}
    <Icon
      icon="lucide/eye-off"
      class="size-4"
    />
  {/if}
</Toggle>
