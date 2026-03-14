<script lang="ts">
  import PasswordCopy from "./password-copy.svelte";
  import PasswordInput from "./password-input.svelte";
  import PasswordRoot from "./password-root.svelte";
  import PasswordStrength from "./password-strength.svelte";
  import PasswordToggleVisibility from "./password-toggle-visibility.svelte";
  import type { PasswordInputProps } from "./types";

  let {
    value,
    copyable = false,
    hide_strength = false,
    ...rest
  }: Omit<PasswordInputProps, "value"> & {
    value?: string | number | undefined;
    copyable?: boolean;
    hide_strength?: boolean;
  } = $props();
</script>

<PasswordRoot>
  <PasswordInput
    autocomplete="new-password"
    bind:value={() => value?.toString() ?? "", (v) => (value = v)}
    {...rest}
  >
    {#if copyable}
      <PasswordCopy />
    {/if}
    <PasswordToggleVisibility />
  </PasswordInput>

  {#if !hide_strength}
    <PasswordStrength />
  {/if}
</PasswordRoot>
