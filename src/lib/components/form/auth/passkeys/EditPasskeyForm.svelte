<script lang="ts">
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import { Toast } from "$lib/utils/toast.util";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import type { MaybePromise } from "$lib/interfaces";
  import {
    list_passkeys_remote,
    rename_passkey_remote,
  } from "$lib/remote/auth/passkey.remote";
  import type { Passkey } from "$lib/server/db/models/auth.model";
  // What Better-Auth hands back, which is not the DB row: 1.7 returns its own
  // shape, wrapped, and it carries no `updatedAt`.
  import type { Passkey as BetterAuthPasskey } from "@better-auth/passkey";
  import { Arrays } from "$lib/utils/array/array.util";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import { result } from "$lib/utils/result.util";
  import FormButton from "../../FormButton.svelte";

  let {
    passkey,
    on_success,
  }: {
    passkey: Pick<Passkey, "id" | "name">;
    on_success?: (d: BetterAuthPasskey) => MaybePromise<void>;
  } = $props();

  const form = rename_passkey_remote;

  FormUtil.init(form, () => ({ name: passkey.name ?? "", id: passkey.id }));
</script>

<form
  class="space-y-3"
  {...form.enhance(async ({ submit, fields }) => {
    // `data` was removed from the enhance instance in SvelteKit 2.70; the
    // pending values are read off the fields themselves now.
    const name = fields.name.value();

    await submit().updates(
      list_passkeys_remote().withOverride((cur) =>
        result.pipe(cur, (d) => Arrays.patch(d, passkey.id, { name })),
      ),
    );

    FormUtil.count_issue_metrics(form, "edit_passkey_form");

    const res = form.result;
    if (res?.ok) {
      Toast.success("Passkey updated");

      // better-auth 1.7 wraps the passkey result rather than returning it flat.
      await on_success?.(res.data.passkey);
    } else if (res?.error) {
      Toast.err(res.error);
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
