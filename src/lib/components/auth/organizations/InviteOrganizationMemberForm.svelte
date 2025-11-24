<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import { ORGANIZATION } from "$lib/const/organization.const";
  import type { ResultData } from "$lib/interfaces";
  import {
    create_invitation_remote,
    get_all_invitations_remote,
  } from "$lib/remote/auth/invitation.remote";
  import { toast } from "svelte-sonner";

  let {
    on_success,
  }: {
    on_success?: (data: ResultData<NonNullable<typeof form.result>>) => void;
  } = $props();

  const form = create_invitation_remote;
</script>

<form
  class="space-y-3"
  {...form.enhance(async ({ submit, data }) => {
    await submit().updates(
      get_all_invitations_remote().withOverride((cur) => [
        { ...data, status: "pending" } as (typeof cur)[number],
        ...cur,
      ]),
    );

    const res = form.result;
    if (res?.ok) {
      toast.success("Invitation sent");
      on_success?.(res.data);
    }
  })}
>
  <div class="flex gap-3">
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
  </div>

  <Button
    type="submit"
    class="w-full"
    icon="lucide/mail"
    loading={form.pending > 0}
  >
    Invite member
  </Button>
</form>
