<script lang="ts">
  import OrganizationMembersList from "$lib/components/auth/members/OrganizationMembersTable.svelte";
  import InviteOrganizationMemberForm from "$lib/components/auth/organizations/InviteOrganizationMemberForm.svelte";
  import OrganizationInvitationsTable from "$lib/components/auth/organizations/OrganizationInvitationsTable.svelte";
  import OrganizationSelector from "$lib/components/auth/organizations/OrganizationSelector.svelte";

  let { data } = $props();
  let { invitations, members } = $state(data);
</script>

<div class="flex flex-col gap-5">
  <h1>Organization</h1>

  <OrganizationSelector />

  <div class="space-y-3">
    <h2>Members</h2>

    <OrganizationMembersList bind:members />
  </div>

  {#if invitations.length}
    <div class="space-y-3">
      <h2>Invites</h2>

      <InviteOrganizationMemberForm
        on_invite={(invitiation) => {
          invitations = [invitiation, ...invitations];
        }}
      />
      <OrganizationInvitationsTable bind:invitations />
    </div>
  {/if}
</div>
