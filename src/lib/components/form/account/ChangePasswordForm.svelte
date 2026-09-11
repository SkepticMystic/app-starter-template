<script lang="ts">
  import Field from "$lib/components/ui/field/Field.svelte";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Password from "$lib/components/ui/password/Password.svelte";
  import { change_password_remote } from "$lib/remote/auth/user.remote";
  import FormButton from "../FormButton.svelte";
  import FormErrors from "../FormErrors.svelte";

  let {
    on_success,
  }: {
    on_success?: () => void;
  } = $props();

  const form = change_password_remote;
</script>

<form
  class="space-y-3"
  {...FormUtil.enhance(form, {
    metric: "change_password_form",
    suc_msg: "Password changed",
    on_success: () => on_success?.(),
  })}
>
  <Field
    label="Current password"
    field={form.fields.current_password}
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
    label="New password"
    field={form.fields.new_password}
  >
    {#snippet input({ props, field })}
      <Password
        {...props}
        {...field?.as("password")}
        required
      />
    {/snippet}
  </Field>

  <FormButton
    {form}
    class="w-full"
    icon="lucide/lock-open"
  >
    Change Password
  </FormButton>

  <FormErrors {form} />
</form>
