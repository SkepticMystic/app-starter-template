<script lang="ts">
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import { Toast } from "#lib/utils/toast.util.js";
  import Checkbox from "#lib/components/ui/checkbox/checkbox.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import type { ResultData } from "#lib/interfaces/result.type.js";
  import { verify_two_factor_backup_code_remote } from "#lib/remote/auth/two_factor.remote.js";
  import { FormUtil } from "#lib/utils/form/form.util.svelte.js";
  import FormButton from "../../FormButton.svelte";
  import CaptchaField from "../captcha/CaptchaField.svelte";

  let {
    on_success,
    hide_trust = false,
  }: {
    hide_trust?: boolean;
    on_success: (data: ResultData<NonNullable<typeof form.result>>) => void;
  } = $props();

  const form = verify_two_factor_backup_code_remote;

  FormUtil.init(form, () => ({
    code: "",
    captcha_token: "",
    trust_device: false,
  }));

  let reset_captcha = $state<() => void>();
</script>

<form
  class="space-y-3"
  {...form.enhance(async (e) => {
    await e.submit();

    FormUtil.count_issue_metrics(form, "verify_two_factor_backup_code_form");

    if (form.fields.allIssues()?.length) {
      reset_captcha?.();
    }

    const res = form.result;
    if (res?.ok) {
      e.element.reset();

      on_success(res.data);
    } else if (res?.error) {
      Toast.err(res.error);
    }
  })}
>
  <Field
    label="Backup code"
    field={form.fields.code}
    description="Enter one of your saved 2FA backup codes to recover your account"
  >
    {#snippet input({ props, field })}
      <Input
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
        />
      {/snippet}
    </Field>
  {/if}

  <CaptchaField
    {form}
    bind:reset={reset_captcha}
  />

  <FormButton
    {form}
    class="w-full"
    icon="lucide/lock"
    disabled={!form.fields.code.value()}
  ></FormButton>

  <FormErrors {form} />
</form>
