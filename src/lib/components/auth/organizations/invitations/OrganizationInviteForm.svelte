<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import { ORGANIZATION } from "$lib/const/auth/organization.const";
  import type { ResultData } from "$lib/interfaces/result.type";
  import {
    create_invitation_remote,
    get_all_invitations_remote,
  } from "$lib/remote/auth/organization/invitation.remote";
  import { toast } from "svelte-sonner";

  let {
    on_success,
  }: {
    on_success?: (data: ResultData<NonNullable<typeof form.result>>) => void;
  } = $props();

  const form = create_invitation_remote;

  form.fields.role.set("member");
  $effect(() => {
    form.fields.role.set("member");
  });
</script>

<form
  class="space-y-3"
  {...form.enhance(async (e) => {
    await e
      .submit()
      .updates(
        get_all_invitations_remote().withOverride((cur) => [
          { ...e.data, status: "pending" } as (typeof cur)[number],
          ...cur,
        ]),
      );

    const res = form.result;
    if (res?.ok) {
      toast.success("Invitation sent");
      on_success?.(res.data);
      e.form.reset();
    } else if (res?.error) {
      toast.error(res.error.message);
    }
  })}
>
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

  <Button
    type="submit"
    class="w-full"
    icon="lucide/mail"
    loading={form.pending > 0}
  >
    Invite member
  </Button>
</form>
