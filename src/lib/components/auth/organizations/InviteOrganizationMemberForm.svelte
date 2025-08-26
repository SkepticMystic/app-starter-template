<script lang="ts">
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
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
    <Label lbl="Email">
      <input
        type="email"
        class="input"
        autocomplete="email"
        bind:value={form.email}
      />
    </Label>

    <Label lbl="Role">
      <select class="select" bind:value={form.role}>
        {#each ORGANIZATION.ROLES.IDS as role_id (role_id)}
          {@const role = ORGANIZATION.ROLES.MAP[role_id]}

          <option value={role_id}>
            {role.name}
          </option>
        {/each}
      </select>
    </Label>

    <button
      onclick={invite_member}
      class="btn btn-secondary"
      disabled={!form.email || any_loading($loader)}
    >
      <Loading loading={$loader["invite_member"]} />
      Invite Member
    </button>
  </div>
</form>
