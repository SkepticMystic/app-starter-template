<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import InputOtp from "$lib/components/ui/input-otp/input-otp.svelte";
  import { TWO_FACTOR } from "$lib/const/auth/two_factor.const";
  import type { ResultData } from "$lib/interfaces/result.type";
  import { verify_totp_remote } from "$lib/remote/auth/two_factor.remote";
  import { toast } from "svelte-sonner";

  let {
    on_success,
    hide_trust = false,
  }: {
    hide_trust?: boolean;
    on_success: (data: ResultData<NonNullable<typeof form.result>>) => void;
  } = $props();

  const form = verify_totp_remote;
</script>

<form
  class="space-y-3"
  {...form.enhance(async (e) => {
    await e.submit();

    const res = form.result;
    if (res?.ok) {
      e.form.reset();

      on_success(res.data);
    } else if (res?.error) {
      toast.error(res.error.message);
    }
  })}
>
  <Field
    label="Pin code"
    field={form.fields.code}
    description="The {TWO_FACTOR.TOTP.DIGITS} digit code from your 2FA app"
  >
    {#snippet input({ props, field })}
      <InputOtp
        {...props}
        {...field?.as("text")}
      />
    {/snippet}
  </Field>

  {#if !hide_trust}
    <Field
      orientation="horizontal"
      field={form.fields.trust_device}
      label="Trust this device for 30 days?"
    >
      {#snippet input({ props, field })}
        <Checkbox
          {...props}
          {...field?.as("checkbox")}
          type="button"
        />
      {/snippet}
    </Field>
  {/if}

  <Button
    class="w-full"
    type="submit"
    icon="lucide/lock"
    loading={form.pending > 0}
    disabled={form.fields.code.value() === undefined ||
      form.fields.code.value().length !== TWO_FACTOR.TOTP.DIGITS}
  >
    Submit
  </Button>
</form>
