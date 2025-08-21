<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { AuthClient } from "$lib/auth-client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import type { Invitation } from "$lib/models/auth/Invitation.model";
  import { Dates } from "$lib/utils/dates";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";

  interface Props {
    invitations: Invitation[];
  }

  let { invitations }: Props = $props();

  const loader = Loader<`delete_invite:${string}`>();

  const delete_invite = async (invite_id: string) => {
    if (!confirm("Are you sure you want to delete this invite?")) return;

    loader.load(`delete_invite:${invite_id}`);

    const res = await AuthClient.organization.cancelInvitation({
      invitationId: invite_id,
    });

    if (res.data) {
      toast.success("Invite deleted");
      await invalidateAll();
    } else {
      console.warn("Failed to delete invite:", res.error);
      toast.error("Failed to delete invite: " + res.error.message);
    }

    loader.reset();
  };
</script>

<div class="flex gap-3">
  {#each invitations as { id, email, expiresAt, role } (id)}
    <div class="rounded-box bg-base-100 flex flex-col gap-2 border p-3">
      <span>
        <span>{email}</span> -
        <span class="capitalize">{role}</span>
      </span>

      <span class="">
        Expires: {Dates.show_date(expiresAt)}
      </span>

      <button
        class="btn btn-error"
        disabled={any_loading($loader)}
        onclick={() => delete_invite(id)}
      >
        <Loading loading={$loader[`delete_invite:${id}`]} />
        Delete
      </button>
    </div>
  {/each}
</div>
