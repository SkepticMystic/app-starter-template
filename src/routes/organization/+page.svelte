<script lang="ts">
  import OrganizationMembersList from "$lib/components/auth/members/OrganizationMembersList.svelte";
  import InviteOrganizationMemberForm from "../../lib/components/auth/organizations/InviteOrganizationMemberForm.svelte";
  import OrganizationInvitationsList from "../../lib/components/auth/organizations/OrganizationInvitationsList.svelte";

  let { data } = $props();
</script>

<div class="space-y-5">
  <h1 class="text-2xl">Organization</h1>

  {#if data.invitations.length}
    <div>
      <div class="divider">
        <h2 class="text-xl">Invites</h2>
      </div>

      <OrganizationInvitationsList invitations={data.invitations} />
    </div>
  {/if}

  <div>
    <div class="divider">
      <h2 class="text-xl">Invite a new member</h2>
    </div>

    <InviteOrganizationMemberForm />
  </div>

  <div>
    <div class="divider">
      <h2 class="text-xl">Members</h2>
    </div>

    <OrganizationMembersList members={data.members.members} />
  </div>
</div>
