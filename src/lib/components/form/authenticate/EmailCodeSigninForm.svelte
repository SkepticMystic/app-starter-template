<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import FormButton from "#lib/components/form/FormButton.svelte";
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import InputOtp from "#lib/components/ui/input-otp/input-otp.svelte";
  import { EMAIL_OTP } from "#lib/const/auth/email_otp.const.js";
  import { signin_code_remote } from "#lib/remote/auth/auth.remote.js";
  import { FormUtil } from "#lib/utils/form/form.util.svelte.js";
  import { Toast } from "#lib/utils/toast.util.js";

  let {
    email,
    redirect_uri,
  }: {
    email: string;
    redirect_uri: ResolvedPathname;
  } = $props();

  const form = signin_code_remote;
</script>

<form
  class="space-y-3"
  {...form.enhance(async (e) => {
    await e.submit();

    FormUtil.count_issue_metrics(form, "email_code_signin_form");

    const res = form.result;

    if (!res?.ok && res?.error) {
      Toast.err(res.error);
    } else if (!form.fields.allIssues()?.length) {
      // The remote redirects on success, so there is no result to branch on:
      // anything that is neither an error nor an issue signed in.
      e.element.reset();
    }
  })}
>
  <input {...form.fields.email.as("hidden", email)} />
  <input {...form.fields.redirect_uri.as("hidden", redirect_uri)} />

  <Field
    label="Sign-in code"
    field={form.fields.code}
    description="The {EMAIL_OTP.LENGTH}-digit code from the email"
  >
    {#snippet input({ props, field })}
      <InputOtp
        {...props}
        {...field?.as("text")}
      />
    {/snippet}
  </Field>

  <FormButton
    {form}
    class="w-full"
    icon="lucide/log-in"
    disabled={form.fields.code.value()?.length !== EMAIL_OTP.LENGTH}
  >
    Sign in
  </FormButton>

  <FormErrors {form} />
</form>
