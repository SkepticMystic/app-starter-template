<script lang="ts">
  import { cn } from "$lib/utils/shadcn.util";
  import CopyButton from "../copy-button/copy-button.svelte";
  import { usePasswordCopy } from "./password.svelte.js";
  import type { PasswordCopyButtonProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: PasswordCopyButtonProps = $props();

  const state = usePasswordCopy();
</script>

<CopyButton
  {...rest}
  bind:ref
  text={state.root.passwordState.value}
  tabindex={-1}
  class={cn(
    "absolute top-1/2 right-0 size-9 min-w-0 -translate-y-1/2 text-muted-foreground hover:!bg-transparent",
    className,
  )}
/>
