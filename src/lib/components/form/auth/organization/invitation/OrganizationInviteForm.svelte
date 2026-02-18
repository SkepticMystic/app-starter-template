<script lang="ts">
  import FormButton from "$lib/components/form/FormButton.svelte";
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import { ORGANIZATION } from "$lib/const/auth/organization.const";
  import type { ResultData } from "$lib/interfaces/result.type";
  import { create_invitation_remote } from "$lib/remote/auth/organization/invitation.remote";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import { toast } from "svelte-sonner";

  let {
    on_success,
  }: {
    on_success?: (data: ResultData<NonNullable<typeof form.result>>) => void;
  } = $props();

  const form = create_invitation_remote;

  FormUtil.init(form, () => ({ role: "member" }));
</script>

<form
  class="space-y-3"
  {...form.enhance(async (e) => {
    await e.submit();

    FormUtil.count_issue_metrics(form, "organization_invite_form");

    const res = form.result;
    if (res?.ok) {
      toast.success("Invitation sent");
      on_success?.(res.data);
      e.form.reset();
    } else if (res?.error) {
      toast.error(res.error.message);
    }
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
