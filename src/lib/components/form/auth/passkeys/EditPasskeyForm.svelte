<script lang="ts">
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import {
    list_passkeys_remote,
    rename_passkey_remote,
  } from "$lib/remote/auth/passkey.remote";
  import type { Passkey } from "$lib/server/db/models/auth.model";
  import { Arrays } from "$lib/utils/array/array.util";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import { result } from "$lib/utils/result.util";
  import { toast } from "svelte-sonner";
  import FormButton from "../../FormButton.svelte";

  let {
    passkey,
  }: {
    passkey: Pick<Passkey, "id" | "name">;
  } = $props();

  const form = rename_passkey_remote;

  FormUtil.init(form, () => ({ name: passkey.name ?? "" }));
</script>

<form
  class="space-y-3"
  {...form.enhance(async ({ submit, data }) => {
    await submit().updates(
      list_passkeys_remote().withOverride((cur) =>
        result.pipe(cur, (d) =>
          Arrays.patch(d, passkey.id, { name: data.name }),
        ),
      ),
    );

    FormUtil.count_issue_metrics(form, "edit_passkey_form");

    const res = form.result;
    if (res?.ok) {
      toast.success("Passkey updated successfully");
    } else if (res?.error) {
      toast.error(res.error.message);
    }
  })}
>
  <input {...form.fields.id.as("hidden", passkey.id)} />

  <Field
    label="Name"
    field={form.fields.name}
  >
    {#snippet input({ props, field })}
      <Input
        {...props}
        {...field?.as("text")}
        required
      />
    {/snippet}
  </Field>

  <FormButton
    {form}
    class="w-full"
    icon="lucide/tag"
  >
    Update passkey
  </FormButton>

  <FormErrors {form} />
</form>
