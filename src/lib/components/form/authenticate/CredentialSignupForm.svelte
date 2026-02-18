<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import FormButton from "$lib/components/form/FormButton.svelte";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Password from "$lib/components/ui/password/Password.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth/auth.const";
  import { signup_credentials_remote } from "$lib/remote/auth/auth.remote";
  import { toast } from "svelte-sonner";
  import Captcha from "../auth/captcha/Captcha.svelte";
  import FormErrors from "../FormErrors.svelte";

  let {
    redirect_uri,
  }: {
    redirect_uri: ResolvedPathname | null;
  } = $props();

  const provider_id = "credential" satisfies IAuth.ProviderId;
  const provider = AUTH.PROVIDERS.MAP[provider_id];

  const form = signup_credentials_remote;

  let reset_captcha = $state<() => void>();
</script>

<form
  class="space-y-3"
  {...form.enhance(async (e) => {
    await e.submit();

    if (form.fields.allIssues()?.length) {
      reset_captcha?.();
    }

    const res = form.result;
    if (res?.ok) {
      e.form.reset();
    } else if (res?.ok === false) {
      toast.error(res.error.message);
    }
  })}
>
  <Field
    label="Name"
    field={form.fields.name}
  >
    {#snippet input({ props, field })}
      <Input
        {...props}
        {...field?.as("text")}
        required
        autocomplete="name"
      />
    {/snippet}
  </Field>

  <Field
    label="Email"
    field={form.fields.email}
  >
    {#snippet input({ props, field })}
      <Input
        {...props}
        {...field?.as("email")}
        required
        autocomplete="email"
      />
    {/snippet}
  </Field>

  <Field
    label="Password"
    field={form.fields.password}
  >
    {#snippet input({ props, field })}
      <Password
        {...props}
        {...field?.as("password")}
        required
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
        type="button"
      />
    {/snippet}
  </Field>

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

  <input
    {...form.fields.redirect_uri.as("hidden", redirect_uri ?? "/onboarding")}
  />

  <FormButton
    {form}
    class="w-full"
    icon={provider.icon}
  >
    Signup with {provider.name}
  </FormButton>

  <FormErrors {form} />
</form>
