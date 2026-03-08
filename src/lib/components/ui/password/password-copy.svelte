<script lang="ts">
  import {} from "$lib/utils/shadcn.util";
  import CopyButton from "../copy-button/copy-button.svelte";
  import { usePasswordCopy } from "./password.svelte.js";
  import type { PasswordCopyButtonProps } from "./types.js";

  let { class: className, ...rest }: PasswordCopyButtonProps = $props();

  const state = usePasswordCopy();
</script>

<CopyButton
  {...rest}
  text={state.root.passwordState.value}
  tabindex={-1}
  class={[
    `
      absolute top-1/2 right-0 size-9 min-w-0 -translate-y-1/2
      text-muted-foreground
      hover:bg-transparent!
    `,
    className,
  ]}
/>
