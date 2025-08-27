<script lang="ts">
  import OrganizationMembersList from "$lib/components/auth/members/OrganizationMembersTable.svelte";
  import InviteOrganizationMemberForm from "$lib/components/auth/organizations/InviteOrganizationMemberForm.svelte";
  import OrganizationInvitationsList from "$lib/components/auth/organizations/OrganizationInvitationsList.svelte";
  import OrganizationSelector from "$lib/components/auth/organizations/OrganizationSelector.svelte";

  let { data } = $props();
  let { invitations, members } = $state(data);
</script>

<div class="flex flex-col gap-5">
  <h1>Organization</h1>

  <OrganizationSelector />

  <div class="space-y-5">
    <div class="divider">
      <h2>Members</h2>
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
        <h2>Invites</h2>
      </div>

      <OrganizationInvitationsList bind:invitations />
    </div>
  {/if}
</div>
