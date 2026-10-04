<script lang="ts">
  import FormButton from "#lib/components/form/FormButton.svelte";
  import Checkbox from "#lib/components/ui/checkbox/checkbox.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import { AUTH, type IAuth } from "#lib/const/auth/auth.const.js";
  import { signin_credentials_remote } from "#lib/remote/auth/auth.remote.js";
  import { FormUtil } from "#lib/utils/form/form.util.svelte.js";
  import { Toast } from "#lib/utils/toast.util.js";
  import type { ResolvedPathname } from "$app/types";
  import FormErrors from "../FormErrors.svelte";

  let {
    redirect_uri,
  }: {
    redirect_uri: ResolvedPathname;
  } = $props();

  const provider_id = "credential" satisfies IAuth.ProviderId;
  const provider = AUTH.PROVIDERS.MAP[provider_id];

  const form = signin_credentials_remote;
</script>

<form
  class="space-y-3"
  {...form.enhance(async (e) => {
    await e.submit();

    FormUtil.count_issue_metrics(form, "credential_signin_form");

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
  <input {...form.fields.redirect_uri.as("hidden", redirect_uri)} />

  <Field
    label="Email"
    field={form.fields.email}
  >
    {#snippet input({ props, field })}
      <Input
        {...props}
        {...field?.as("email")}
        required
        autocomplete="username webauthn"
      />
    {/snippet}
  </Field>

  <Field
    label="Password"
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

  <Field
    label="Remember me"
    orientation="horizontal"
    field={form.fields.remember}
  >
    {#snippet input({ props, field })}
      <Checkbox
        {...props}
        {...field?.as("checkbox")}
      />
    {/snippet}
  </Field>

  <FormButton
    {form}
    class="w-full"
    icon={provider.icon}
  >
    Sign in with {provider.name}
  </FormButton>

  <FormErrors {form} />
</form>
