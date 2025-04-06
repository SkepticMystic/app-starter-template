<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { ROLES, type Role } from "$lib/auth/roles";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import { get_http_error_msg } from "$lib/utils/errors";
  import { any_loading, Loader } from "$lib/utils/loader";
  import axios from "axios";
  import { toast } from "svelte-daisyui-toast";

  const loader = Loader<"invite">();

  let email = $state("");
  let role: Role = $state("member");

  const inviteToTeam = async () => {
    toast.set([]);
    loader.load("invite");

    try {
      const { data } = await axios.post("/api/team/invite", { email, role });

      if (data.ok) {
        toast.success("Invite sent!");
        (email = ""), (role = "member");

        await invalidateAll();
      }
    } catch (error) {
      console.log(error);
      toast.error(get_http_error_msg(error));
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
        bind:value={email}
      />
    </Label>

    <Label lbl="Role">
      <select class="select" bind:value={role}>
        {#each ROLES as role}
          <option value={role}>{role}</option>
        {/each}
      </select>
    </Label>

    <div class="flex flex-wrap items-center gap-3">
      <button
        class="btn btn-secondary"
        disabled={!email || !role || any_loading($loader)}
        onclick={inviteToTeam}
      >
        <Loading loading={$loader["invite"]} />
        Invite to Team
      </button>
    </div>
  </div>
</form>
