<script lang="ts">
  import Invite from "./invite.svelte";
  import Members from "./members.svelte";
  import PendingInvites from "./pendingInvites.svelte";

  let { data } = $props();
</script>

<h1 class="mb-7 text-2xl">Team</h1>

{#if data.invitations.length}
  <h2 class="mt-7 mb-3 text-xl">Pending Invites</h2>
  <PendingInvites invitations={data.invitations} />
{/if}

<h2 class="mt-7 mb-3 text-xl">Invite a new member</h2>
<Invite />

<h2 class="mt-7 mb-3 text-xl">Team Members</h2>
<Members members={data.members.members} />
