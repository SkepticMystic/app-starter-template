<script lang="ts">
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import { change_email_remote } from "#lib/remote/auth/user.remote.js";
  import { FormUtil } from "#lib/utils/form/form.util.svelte.js";
  import FormButton from "../FormButton.svelte";
  import FormErrors from "../FormErrors.svelte";

  let {
    on_success,
  }: {
    on_success?: () => void;
  } = $props();

  const form = change_email_remote;
</script>

<form
  class="space-y-3"
  {...FormUtil.enhance(form, {
    metric: "change_email_form",
    suc_msg: {
      title: "Check your inbox",
      description:
        "Follow the link we sent to approve the change. Your email stays the same until you do.",
    },
    reset: true,
    on_success,
  })}
>
  <Field
    label="New email"
    field={form.fields.new_email}
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

  <FormButton
    {form}
    class="w-full"
    icon="lucide/mail"
  >
    Send approval link
  </FormButton>

  <FormErrors {form} />
</form>
