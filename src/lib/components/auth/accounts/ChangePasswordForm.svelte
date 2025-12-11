<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Password from "$lib/components/ui/password/Password.svelte";
  import { change_password_remote } from "$lib/remote/auth/user.remote";
  import { toast } from "svelte-sonner";

  let {
    on_success,
  }: {
    on_success?: () => void;
  } = $props();

  const form = change_password_remote;
</script>

<form
  class="space-y-3"
  {...form.enhance(async ({ submit }) => {
    await submit();

    const res = form.result;
    if (res?.ok) {
      toast.success(res.data.message);
      on_success?.();
    } else if (res?.error) {
      toast.error(res.error.message);
    }
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

  <Button
    type="submit"
    class="w-full"
    icon="lucide/lock-open"
    loading={form.pending > 0}
  >
    Change Password
  </Button>
</form>
