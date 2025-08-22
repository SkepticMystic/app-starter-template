<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { any_loading, Loader } from "$lib/utils/loader";

  const loader = Loader<"invite_member">();

  let form: { email: string; role: "member" } = $state({
    email: "",
    role: "member",
  });

  const invite_member = async () => {
    loader.load("invite_member");

    const res = await OrganizationsClient.invite_member(form);
    if (res.ok) {
      await invalidateAll();
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
    <!-- 
    <Label lbl="Role">
      <select class="select" bind:value={role}>
        {#each ROLES as role}
          <option value={role}>{role}</option>
        {/each}
      </select>
    </Label> -->

    <div class="flex flex-wrap items-center gap-3">
      <button
        onclick={invite_member}
        class="btn btn-secondary"
        disabled={!form.email || any_loading($loader)}
      >
        <Loading loading={$loader["invite_member"]} />
        Invite Member
      </button>
    </div>
  </div>
</form>
