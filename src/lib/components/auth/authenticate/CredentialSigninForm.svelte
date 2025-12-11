<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import { BetterAuthClient } from "$lib/auth-client";
  import Button from "$lib/components/ui/button/button.svelte";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth/auth.const.js";
  import { signin_credentials_remote } from "$lib/remote/auth/auth.remote";
  import { toast } from "svelte-sonner";

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

    const res = form.result;
    console.log("signin_credentials_remote.result", res);

    if (!res?.ok && res?.error) {
      toast.error(res.error.message);
    } else {
      // NOTE: Bit weird. We throw a redirect in the remote form, so there isn't a suc result to branch on.
      // Instead, we assume that any non-error result is successful, and notify the session signal
      BetterAuthClient.$store.notify("$sessionSignal");

      e.form.reset();
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
        autocomplete="email"
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
      <!-- NOTE: We have to do this weird type thing...
     - If I use a Checkbox without the type attr (and let field.as('checkbox') add its type), we get a TS error and bad form behvaiour (submitting the form just checks this box)
     - If I use an Input, no TS errors, but a runtime svelte error about binding to value instead of checked
     - A regular <input /> works, but no styling -->
      <Checkbox
        {...props}
        {...field?.as("checkbox")}
        type="button"
      />
    {/snippet}
  </Field>

  <Button
    type="submit"
    class="w-full"
    icon={provider.icon}
    loading={form.pending > 0}
  >
    Signin with {provider.name}
  </Button>
</form>
