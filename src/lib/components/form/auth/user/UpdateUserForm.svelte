<script lang="ts">
  import { invalidate } from "$app/navigation";
  import FormButton from "#lib/components/form/FormButton.svelte";
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import type { MaybePromise } from "#lib/interfaces/index.js";
  import { update_user_remote } from "#lib/remote/auth/user.remote.js";
  import { FormUtil } from "#lib/utils/form/form.util.svelte.js";
  import type { User } from "better-auth";

  let {
    initial,
    on_success,
  }: {
    initial: Pick<User, "name" | "image">;
    on_success?: () => MaybePromise<void>;
  } = $props();

  const form = update_user_remote;

  FormUtil.init(form, () => ({
    name: initial.name,
    image: initial.image ?? "",
  }));
</script>

<form
  class="space-y-3"
  {...FormUtil.enhance(form, {
    metric: "update_user_form",
    suc_msg: "Profile updated",
    on_success: async () => {
      // The sidebar reads `page.data.user`.
      await invalidate("app:session");

      await on_success?.();
    },
  })}
>
  <Field
    label="Name"
    field={form.fields.name}
  >
    {#snippet input({ props, field })}
      <Input
        {...props}
        {...field?.as("text")}
        required
        maxlength={100}
        autocomplete="name"
      />
    {/snippet}
  </Field>

  <Field
    label="Image URL"
    field={form.fields.image}
  >
    {#snippet input({ props, field })}
      <Input
        {...props}
        {...field?.as("url")}
      />
    {/snippet}
  </Field>

  <FormButton
    {form}
    class="w-full"
  >
    Update profile
  </FormButton>

  <FormErrors {form} />
</form>
