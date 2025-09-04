<script lang="ts">
  import OrganizationMembersList from "$lib/components/auth/members/OrganizationMembersTable.svelte";
  import InviteOrganizationMemberForm from "$lib/components/auth/organizations/InviteOrganizationMemberForm.svelte";
  import OrganizationInvitationsTable from "$lib/components/auth/organizations/OrganizationInvitationsTable.svelte";
  import OrganizationSelector from "$lib/components/auth/organizations/OrganizationSelector.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import Dialog from "$lib/components/ui/dialog/dialog.svelte";

  let { data } = $props();
  let { invitations, members } = $state(data);
</script>

<div class="flex flex-col gap-7">
  <div class="space-y-3">
    <h1>Organization</h1>
    <OrganizationSelector />
  </div>

  <div class="space-y-3">
    <h2>Members</h2>
    <OrganizationMembersList bind:members />
  </div>

  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h2>Invites</h2>

      <Dialog
        variant="outline"
        title="Invite Member"
        description="Invite a new member to your organization"
      >
        {#snippet trigger()}
          <Icon icon="lucide/user-plus" /> Invite Member
        {/snippet}

        {#snippet content({ close })}
          <InviteOrganizationMemberForm
            form_input={data.member_invite_form_input}
            on_invite={(invitation) =>
              invitations.unshift(invitation) && close()}
          />
        {/snippet}
      </Dialog>
    </div>

    {#if invitations.length}
      <OrganizationInvitationsTable
        {invitations}
        on_delete={(invitation) =>
          (invitations = invitations.filter((i) => i.id !== invitation.id))}
      />
    {/if}
  </div>
</div>
