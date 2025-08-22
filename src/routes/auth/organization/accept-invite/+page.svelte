<script lang="ts">
  import { goto } from "$app/navigation";
  import { OrganizationsClient } from "$lib/clients/organizations.client.js";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { ROUTES } from "$lib/const/routes.const.js";
  import { any_loading, Loader } from "$lib/utils/loader";

  let { data } = $props();

  const loader = Loader<"accept_invite">();

  const accept_invite = async () => {
    loader.load("accept_invite");

    const res = await OrganizationsClient.accept_invitation(data.invitation.id);
    if (res.ok) {
      await goto(ROUTES.HOME);
    }

    loader.reset();
  };
</script>

<div class="space-y-3">
  <h2 class="text-xl font-semibold">Accept Invitation</h2>

  <p>
    You've been invited by <strong>{data.invitation.inviterEmail}</strong> to
    join the org:
    <strong>{data.invitation.organizationName}</strong>.
  </p>

  <button
    class="btn btn-primary"
    disabled={any_loading($loader)}
    onclick={accept_invite}
  >
    <Loading loading={$loader["accept_invite"]} />
    Accept Invite
  </button>
</div>
