<script lang="ts">
  import { goto } from "$app/navigation";
  import { BetterAuthClient } from "$lib/auth-client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { ROUTES } from "$lib/const/routes.const.js";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";

  let { data } = $props();

  const loader = Loader<"accept_invite">();

  const accept_invite = async () => {
    toast.set([]);
    loader.load("accept_invite");

    const res = await BetterAuthClient.organization.acceptInvitation({
      invitationId: data.invitation.id,
    });
    if (res.data) {
      toast.success("Invitation accepted.", {
        clear_on_navigate: false,
      });

      await goto(ROUTES.HOME);
    } else {
      toast.error("Failed to accept invitation: " + res.error.message);
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
