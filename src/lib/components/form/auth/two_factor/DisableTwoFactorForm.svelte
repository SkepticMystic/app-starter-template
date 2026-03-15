<script lang="ts">
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Fieldset from "$lib/components/ui/field/Fieldset.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import type { MaybePromise } from "$lib/interfaces";
  import type { ResultData } from "$lib/interfaces/result.type";
  import { disable_two_factor_remote } from "$lib/remote/auth/two_factor.remote";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import { toast } from "svelte-sonner";
  import FormButton from "../../FormButton.svelte";
  import CaptchaField from "../captcha/CaptchaField.svelte";

  let {
    on_success,
  }: {
    on_success: (
      data: ResultData<NonNullable<typeof form.result>>,
    ) => MaybePromise<void>;
  } = $props();

  const form = disable_two_factor_remote;

  FormUtil.init(form, () => ({
    password: "",
    captcha_token: "",
  }));

  let reset_captcha = $state<() => void>();
</script>

<form
  class="space-y-3"
  {...form.enhance(async (e) => {
    if (
      !confirm("Are you sure you want to disable two-factor authentication?")
    ) {
      return;
    }

    await e.submit();

    FormUtil.count_issue_metrics(form, "disable_two_factor_form");

    if (form.fields.allIssues()?.length) {
      reset_captcha?.();
    }

    const res = form.result;
    if (res?.ok) {
      e.form.reset();

      toast.success("Two-Factor Authentication disabled");

      await on_success(res.data);
    } else if (res?.error) {
      toast.error(res.error.message);
    }
  })}
>
  <Fieldset
    legend="Disable Two-Factor Authentication"
    description="You will need to provide your password."
  >
    <Field
      label="Current Password"
      field={form.fields.password}
    >
      {#snippet input({ props, field })}
        <Input
          {...props}
          {...field?.as("password")}
          required
          autocomplete="current-password"
        />
      {/snippet}
    </Field>

    <CaptchaField
      {form}
      bind:reset={reset_captcha}
    />

    <FormButton
      {form}
      class="w-full"
      icon="lucide/x"
      variant="destructive"
    >
      Disable Two-Factor Authentication
    </FormButton>

    <FormErrors {form} />
  </Fieldset>
</form>
