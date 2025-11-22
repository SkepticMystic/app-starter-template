<script lang="ts">
  import { Client } from "$lib/clients/index.client";
  import FormFieldControl from "$lib/components/form/fields/FormFieldControl.svelte";
  import FormMessage from "$lib/components/form/FormMessage.svelte";
  import SuperformInput from "$lib/components/form/inputs/SuperformInput.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import { ORGANIZATION } from "$lib/const/organization.const";
  import { create_invitation } from "$lib/remote/auth/organization.remote";
  import { AuthSchema } from "$lib/schema/auth.schema";
  import { make_super_form } from "$lib/utils/form.util";
  import type { Invitation } from "better-auth/plugins";
  import { type Infer, type SuperValidated } from "sveltekit-superforms";
  import { zod4Client } from "sveltekit-superforms/adapters";

  let {
    on_success,
    form_input,
  }: {
    on_success?: (data: Invitation) => void;
    form_input: SuperValidated<Infer<typeof AuthSchema.Org.member_invite_form>>;
  } = $props();

  const form = make_super_form(form_input, {
    timeoutMs: 16_000,
    validators: zod4Client(AuthSchema.Org.member_invite_form),

    on_success,
    submit: (data) =>
      Client.request(() => create_invitation(data), {
        toast: { loading: "Inviting member...", success: "Member invited!" },
      }),
  });

  const { form: form_data } = form;
</script>

<form
  class="flex flex-col gap-3"
  method="POST"
  use:form.enhance
>
  <div class="flex gap-3">
    <FormFieldControl
      {form}
      name="email"
      label="Email"
    >
      {#snippet children({ props })}
        <SuperformInput
          {...props}
          {form}
          type="email"
          autocomplete="email"
        />
      {/snippet}
    </FormFieldControl>

    <FormFieldControl
      {form}
      name="role"
      label="Role"
    >
      {#snippet children({ props })}
        <NativeSelect
          {...props}
          options={ORGANIZATION.ROLES.OPTIONS}
          bind:value={$form_data.role}
        />
      {/snippet}
    </FormFieldControl>
  </div>

  <FormButton
    {form}
    icon="lucide/user-plus">Invite Member</FormButton
  >

  <FormMessage {form} />
</form>
