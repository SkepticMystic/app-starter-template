<script lang="ts">
  import FormControl from "$lib/components/form/FormControl.svelte";
  import FormField from "$lib/components/form/FormField.svelte";
  import FormButton from "$lib/components/ui/form/form-button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import SingleSelect from "$lib/components/ui/select/SingleSelect.svelte";
  import { ORGANIZATION } from "$lib/const/organization.const";
  import { create_invitation } from "$lib/remote/auth/organization.remote";
  import { AuthSchema } from "$lib/schema/auth.schema";
  import { make_super_form } from "$lib/utils/form.util";
  import { type Infer, type SuperValidated } from "sveltekit-superforms";

  let {
    on_invite,
    form_input,
  }: {
    form_input: SuperValidated<Infer<typeof AuthSchema.Org.member_invite_form>>;
    on_invite?: (
      data: Extract<
        Awaited<ReturnType<typeof create_invitation>>,
        { ok: true }
      >["data"],
    ) => void;
  } = $props();

  const form = make_super_form(form_input, AuthSchema.Org.member_invite_form, {
    timeoutMs: 8_000,

    on_success: on_invite,
    submit: create_invitation,
    toast: { loading: "Inviting member...", success: "Member invited!" },
  });

  const { form: form_data, message, enhance, pending } = form;
</script>

<form class="flex flex-col gap-3" method="POST" use:enhance>
  <div class="flex gap-3">
    <FormField class="grow" {form} name="email">
      <FormControl label="Email">
        {#snippet children({ props })}
          <Input
            {...props}
            required
            type="email"
            bind:value={$form_data.email}
          />
        {/snippet}
      </FormControl>
    </FormField>

    <FormField {form} name="role">
      <FormControl label="Role">
        {#snippet children({ props })}
          <SingleSelect
            {...props}
            options={ORGANIZATION.ROLES.OPTIONS}
            bind:value={$form_data.role}
          />
        {/snippet}
      </FormControl>
    </FormField>
  </div>

  <FormButton loading={$pending} icon="lucide/user-plus">
    Invite Member
  </FormButton>

  {#if $message && !$message.ok && $message.error}
    <p class="text-warning">{$message.error}</p>
  {/if}
</form>
