<script lang="ts">
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import type { ResultData } from "$lib/interfaces/result.type";
  import { verify_two_factor_backup_code_remote } from "$lib/remote/auth/two_factor.remote";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import { toast } from "svelte-sonner";
  import FormButton from "../../FormButton.svelte";
  import Captcha from "../captcha/Captcha.svelte";

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
      e.form.reset();

      on_success(res.data);
    } else if (res?.error) {
      toast.error(res.error.message);
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
          type="button"
        />
      {/snippet}
    </Field>
  {/if}

  <Field
    label=""
    field={form.fields.captcha_token}
  >
    {#snippet input({ props, field })}
      <Captcha
        {...props}
        {...field?.as("text")}
        bind:reset={reset_captcha}
      />
    {/snippet}
  </Field>

  <FormButton
    {form}
    class="w-full"
    icon="lucide/lock"
    disabled={!form.fields.code.value()}
  ></FormButton>

  <FormErrors {form} />
</form>
