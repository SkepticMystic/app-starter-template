<script lang="ts">
  import PasswordInput from "./password-input.svelte";
  import PasswordRoot from "./password-root.svelte";
  import PasswordStrength from "./password-strength.svelte";
  import PasswordToggleVisibility from "./password-toggle-visibility.svelte";
  import type { PasswordInputProps } from "./types";

  let {
    value,
    ...rest
  }: Omit<PasswordInputProps, "value"> & {
    value?: string | number | undefined;
  } = $props();

  // TODO:
  // - Enforce min score
  // - Optional copy button
</script>

<PasswordRoot>
  <PasswordInput
    {...rest}
    autocomplete="new-password"
    bind:value={() => value?.toString() ?? "", (v) => (value = v)}
  >
    <!-- <PasswordCopy /> -->
    <PasswordToggleVisibility />
  </PasswordInput>

  <PasswordStrength />
</PasswordRoot>
