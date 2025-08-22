<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { BetterAuthClient } from "$lib/auth-client";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";

  const loader = Loader<"invite">();

  let form: { email: string; role: "member" } = $state({
    email: "",
    role: "member",
  });

  const inviteToTeam = async () => {
    toast.set([]);
    loader.load("invite");

    const res = await BetterAuthClient.organization.inviteMember(form);

    if (res.data) {
      toast.success("Invite sent!");

      await invalidateAll();
    } else {
      console.warn("Failed to invite member:", res.error);
      toast.warning("Failed to invite member: " + res.error.message);
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
        class="btn btn-secondary"
        disabled={!form.email || any_loading($loader)}
        onclick={inviteToTeam}
      >
        <Loading loading={$loader["invite"]} />
        Invite to Team
      </button>
    </div>
  </div>
</form>
