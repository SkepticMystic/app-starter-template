<script lang="ts">
  import OrganizationMembersList from "$lib/components/auth/members/OrganizationMembersTable.svelte";
  import InviteOrganizationMemberForm from "../../lib/components/auth/organizations/InviteOrganizationMemberForm.svelte";
  import OrganizationInvitationsList from "../../lib/components/auth/organizations/OrganizationInvitationsList.svelte";

  let { data } = $props();
</script>

<div class="space-y-5">
  <h1 class="text-2xl">Organization</h1>

  <div class="space-y-5">
    <div class="divider">
      <h2 class="text-xl">Members</h2>
    </div>

    <InviteOrganizationMemberForm
      on_invite={(invitiation) => {
        data.invitations = [invitiation, ...data.invitations];
      }}
    />
    <OrganizationMembersList bind:members={data.members} />
  </div>

  {#if data.invitations.length}
    <div>
      <div class="divider">
        <h2 class="text-xl">Invites</h2>
      </div>

      <OrganizationInvitationsList bind:invitations={data.invitations} />
    </div>
  {/if}
</div>
