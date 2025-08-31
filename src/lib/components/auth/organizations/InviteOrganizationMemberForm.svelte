<script lang="ts">
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Labeled from "$lib/components/ui/label/Labeled.svelte";
  import SingleSelect from "$lib/components/ui/select/SingleSelect.svelte";
  import { ORGANIZATION } from "$lib/const/organization.const";
  import { any_loading, Loader } from "$lib/utils/loader";
  import type { Invitation } from "better-auth/plugins";

  let {
    on_invite,
  }: {
    on_invite?: (invitation: Invitation) => void;
  } = $props();

  const loader = Loader<"invite_member">();

  let form: { email: string; role: "member" } = $state({
    email: "",
    role: "member",
  });

  const invite_member = async () => {
    loader.load("invite_member");

    const res = await OrganizationsClient.invite_member(form);
    if (res.ok) {
      on_invite?.(res.data);
    }

    loader.reset();
  };
</script>

<form class="flex flex-col gap-3">
  <div class="flex flex-wrap items-end gap-3">
    <Labeled label="Email">
      <Input type="email" autocomplete="email" bind:value={form.email} />
    </Labeled>

    <Labeled label="Role">
      <SingleSelect
        options={ORGANIZATION.ROLES.OPTIONS}
        bind:value={form.role}
      />
    </Labeled>

    <Button
      onclick={invite_member}
      icon="lucide/user-plus"
      loading={$loader["invite_member"]}
      disabled={!form.email || any_loading($loader)}
    >
      Invite Member
    </Button>
  </div>
</form>
