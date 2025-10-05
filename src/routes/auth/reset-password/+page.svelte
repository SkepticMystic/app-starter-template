<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import { Client } from "$lib/clients/index.client.js";
  import FormFieldControl from "$lib/components/form/fields/FormFieldControl.svelte";
  import FormMessage from "$lib/components/form/FormMessage.svelte";
  import SuperformInput from "$lib/components/form/inputs/SuperformInput.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import { ROUTES } from "$lib/const/routes.const.js";
  import { TOAST } from "$lib/const/toast.const.js";
  import { App } from "$lib/utils/app.js";
  import { make_super_form } from "$lib/utils/form.util.js";
  import { defaults } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";
  import { z } from "zod/mini";

  let { data } = $props();

  const validators = zod4Client(z.object({ new_password: z.string() }));

  const form = make_super_form(defaults({ new_password: "" }, validators), {
    SPA: true,
    validators,

    submit: (form_data) =>
      Client.better_auth(() =>
        BetterAuthClient.resetPassword({
          token: data.search.token,
          newPassword: form_data.new_password,
        }),
      ),

    on_success: () => {
      location.href = App.url(ROUTES.AUTH_SIGNIN, {
        toast: TOAST.IDS.PASSWORD_RESET,
      });
    },
  });
</script>

{#if data.search.token}
  <form class="flex flex-col gap-3" method="POST" use:form.enhance>
    <FormFieldControl {form} name="new_password" label="Password">
      {#snippet children({ props })}
        <SuperformInput
          {...props}
          {form}
          type="password"
          autocomplete="new-password"
        />
      {/snippet}
    </FormFieldControl>

    <FormButton {form} class="w-full" icon="lucide/key">
      Reset Password
    </FormButton>

    <FormMessage {form} />
  </form>
{:else}
  <div class="alert alert-error">
    <span>Invalid or missing reset token ({data.search.error ?? ""})</span>
  </div>
{/if}
