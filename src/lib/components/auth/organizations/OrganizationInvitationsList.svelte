<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import type { Invitation } from "$lib/models/auth/Invitation.model";
  import { Dates } from "$lib/utils/dates";
  import { any_loading, Loader } from "$lib/utils/loader";

  interface Props {
    invitations: Invitation[];
  }

  let { invitations }: Props = $props();

  const loader = Loader<`cancel_invitation:${string}`>();

  const cancel_invitation = async (invite_id: string) => {
    loader.load(`cancel_invitation:${invite_id}`);

    const res = await OrganizationsClient.cancel_invitation(invite_id);
    if (res.ok) {
      await invalidateAll();
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
        onclick={() => cancel_invitation(id)}
      >
        <Loading loading={$loader[`cancel_invitation:${id}`]} />
        Delete
      </button>
    </div>
  {/each}
</div>
