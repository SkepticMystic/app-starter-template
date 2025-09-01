<script lang="ts">
  import FormControl from "$lib/components/form/FormControl.svelte";
  import * as Form from "$lib/components/ui/form/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import SingleSelect from "$lib/components/ui/select/SingleSelect.svelte";
  import { ORGANIZATION } from "$lib/const/organization.const";
  import { create_invitation } from "$lib/remote/auth/organization.remote";
  import { AuthSchema } from "$lib/schema/auth.schema";
  import { make_super_form } from "$lib/utils/form.util";
  import type { Invitation } from "better-auth/plugins";
  import { type Infer, type SuperValidated } from "sveltekit-superforms";

  let {
    on_invite,
    form_input,
  }: {
    on_invite?: (data: Invitation) => void;
    form_input: SuperValidated<Infer<typeof AuthSchema.Org.member_invite_form>>;
  } = $props();

  const super_form = make_super_form(
    form_input,
    AuthSchema.Org.member_invite_form,
    {
      timeoutMs: 8_000,
      remote: create_invitation,

      handle: {
        success: (res) => on_invite && res.data && on_invite(res.data.data),
      },
    },
  );

  const { form: form_data, message, enhance, pending } = super_form;
</script>

<form class="flex flex-col gap-3" method="POST" use:enhance>
  <div class="flex gap-3">
    <Form.Field class="grow" form={super_form} name="email">
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

      <Form.FieldErrors />
    </Form.Field>

    <Form.Field form={super_form} name="role">
      <FormControl label="Role">
        {#snippet children({ props })}
          <SingleSelect
            {...props}
            options={ORGANIZATION.ROLES.OPTIONS}
            bind:value={$form_data.role}
          />
        {/snippet}
      </FormControl>

      <Form.FieldErrors />
    </Form.Field>
  </div>

  <Form.Button loading={$pending} icon="lucide/user-plus">
    Invite Member
  </Form.Button>

  {#if $message && !$message.ok && $message.error}
    <p class="text-warning">{$message.error}</p>
  {/if}
</form>
