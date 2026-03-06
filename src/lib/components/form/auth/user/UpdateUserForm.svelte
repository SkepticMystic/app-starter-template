<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import FormButton from "$lib/components/form/FormButton.svelte";
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import type { MaybePromise } from "$lib/interfaces";
  import { update_user_remote } from "$lib/remote/auth/user.remote";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import type { User } from "better-auth";
  import { toast } from "svelte-sonner";

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
  {...form.enhance(async (e) => {
    await e.submit();

    FormUtil.count_issue_metrics(form, "update_user_form");

    const res = form.result;

    if (res?.ok) {
      toast.success("Profile updated");

      BetterAuthClient.$store.notify("$sessionSignal");

      await on_success?.();
    } else if (res?.error) {
      toast.error(res.error.message);
    }
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
    Update Profile
  </FormButton>

  <FormErrors {form} />
</form>
