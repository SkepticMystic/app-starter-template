<script lang="ts">
  import OrganizationMembersList from "$lib/components/auth/members/OrganizationMembersTable.svelte";
  import InviteOrganizationMemberForm from "$lib/components/auth/organizations/InviteOrganizationMemberForm.svelte";
  import OrganizationInvitationsList from "$lib/components/auth/organizations/OrganizationInvitationsList.svelte";
  import OrganizationSelector from "$lib/components/auth/organizations/OrganizationSelector.svelte";

  let { data } = $props();
  let { invitations, members } = $state(data);
</script>

<div class="space-y-5">
  <h1 class="text-2xl">Organization</h1>

  <OrganizationSelector />

  <div class="space-y-5">
    <div class="divider">
      <h2 class="text-xl">Members</h2>
    </div>

    <InviteOrganizationMemberForm
      on_invite={(invitiation) => {
        invitations = [invitiation, ...invitations];
      }}
    />
    <OrganizationMembersList bind:members />
  </div>

  {#if invitations.length}
    <div>
      <div class="divider">
        <h2 class="text-xl">Invites</h2>
      </div>

      <OrganizationInvitationsList bind:invitations />
    </div>
  {/if}
</div>
