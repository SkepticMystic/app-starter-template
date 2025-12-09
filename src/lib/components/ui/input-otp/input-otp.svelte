<script lang="ts">
  import { TWO_FACTOR } from "$lib/const/auth/two_factor.const";
  import { REGEXP_ONLY_DIGITS } from "bits-ui";
  import type { HTMLInputAttributes } from "svelte/elements";
  import InputOtpGroup from "./input-otp-group.svelte";
  import InputOtpRoot from "./input-otp-root.svelte";
  import InputOtpSeparator from "./input-otp-separator.svelte";
  import InputOtpSlot from "./input-otp-slot.svelte";

  let {
    name,
    value = $bindable(""),
    "aria-invalid": aria_invalid,
  }: {
    name?: string;
    value?: string | number;
    "aria-invalid"?: HTMLInputAttributes["aria-invalid"];
  } = $props();
</script>

<InputOtpRoot
  {name}
  pattern={REGEXP_ONLY_DIGITS}
  maxlength={TWO_FACTOR.TOTP.DIGITS}
  bind:value={() => value.toString(), (v) => (value = v)}
>
  {#snippet children({ cells })}
    <InputOtpGroup>
      {#each cells.slice(0, 3) as cell}
        <InputOtpSlot
          {cell}
          aria-invalid={aria_invalid}
        />
      {/each}
    </InputOtpGroup>

    <InputOtpSeparator />

    <InputOtpGroup>
      {#each cells.slice(3, 6) as cell}
        <InputOtpSlot
          {cell}
          aria-invalid={aria_invalid}
        />
      {/each}
    </InputOtpGroup>
  {/snippet}
</InputOtpRoot>
