<script lang="ts">
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import {
    get_all_passkeys_remote,
    rename_passkey_remote,
  } from "$lib/remote/auth/passkey.remote";
  import type { Passkey } from "$lib/server/db/models/auth.model";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import { Resources } from "$lib/utils/resource/resource.util";
  import { result } from "$lib/utils/result.util";
  import { toast } from "svelte-sonner";

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
      get_all_passkeys_remote().withOverride((cur) =>
        result.pipe(cur, (d) =>
          Resources.patch(d, passkey.id, { name: data.name }),
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

  <Button
    type="submit"
    class="w-full"
    icon="lucide/tag"
    loading={form.pending > 0}
  >
    Update passkey
  </Button>

  <FormErrors {form} />
</form>
