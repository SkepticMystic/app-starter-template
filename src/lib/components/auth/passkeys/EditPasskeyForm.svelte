<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import {
    get_all_passkeys_remote,
    rename_passkey_remote,
  } from "$lib/remote/auth/passkey.remote";
  import type { Passkey } from "$lib/server/db/models/auth.model";
  import { Items } from "$lib/utils/items.util";
  import { result } from "$lib/utils/result.util";
  import { toast } from "svelte-sonner";

  let {
    passkey,
  }: {
    passkey: Pick<Passkey, "id" | "name">;
  } = $props();

  const form = rename_passkey_remote;

  form.fields.name.set(passkey.name ?? "");
</script>

<form
  class="space-y-3"
  {...form.enhance(async ({ submit, data }) => {
    await submit().updates(
      get_all_passkeys_remote().withOverride((cur) =>
        result.pipe(cur, (d) =>
          Items.patch(d, passkey.id, { name: data.name }),
        ),
      ),
    );

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
</form>
