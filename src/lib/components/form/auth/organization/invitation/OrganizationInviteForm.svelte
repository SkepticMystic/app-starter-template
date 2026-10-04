<script lang="ts">
  import FormButton from "#lib/components/form/FormButton.svelte";
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import NativeSelect from "#lib/components/ui/native-select/native-select.svelte";
  import { ORGANIZATION } from "#lib/const/auth/organization.const.js";
  import type { ResultData } from "#lib/interfaces/result.type.js";
  import { create_invitation_remote } from "#lib/remote/auth/organization/invitation.remote.js";
  import { FormUtil } from "#lib/utils/form/form.util.svelte.js";

  let {
    on_success,
  }: {
    on_success?: (data: ResultData<NonNullable<typeof form.result>>) => void;
  } = $props();

  const form = create_invitation_remote;

  FormUtil.init(form, () => ({
    email: "",
    role: "member" as const,
  }));
</script>

<form
  class="space-y-3"
  {...FormUtil.enhance(form, {
    metric: "organization_invite_form",
    suc_msg: "Invitation sent",
    on_success: (data) => on_success?.(data),
    reset: true,
  })}
>
  <Field
    label="Email"
    field={form.fields.email}
  >
    {#snippet input({ props, field })}
      <Input
        {...props}
        {...field?.as("email")}
        required
        autofocus
        autocomplete="email"
      />
    {/snippet}
  </Field>

  <Field
    label="Role"
    field={form.fields.role}
  >
    {#snippet input({ props, field })}
      <NativeSelect
        {...props}
        {...field?.as("select")}
        options={ORGANIZATION.ROLES.OPTIONS}
      />
    {/snippet}
  </Field>

  <FormButton
    {form}
    class="w-full"
    icon="lucide/mail"
  >
    Invite member
  </FormButton>

  <FormErrors {form} />
</form>
