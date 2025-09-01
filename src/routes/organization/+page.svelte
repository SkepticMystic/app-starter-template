<script lang="ts">
  import OrganizationMembersList from "$lib/components/auth/members/OrganizationMembersTable.svelte";
  import InviteOrganizationMemberForm from "$lib/components/auth/organizations/InviteOrganizationMemberForm.svelte";
  import OrganizationInvitationsTable from "$lib/components/auth/organizations/OrganizationInvitationsTable.svelte";
  import OrganizationSelector from "$lib/components/auth/organizations/OrganizationSelector.svelte";
  import Card from "$lib/components/Card.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";

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

  {#if invitations.length}
    <div class="space-y-3">
      <Separator />

      <Card
        title="Invite Member"
        description="Invite a new member to your organization"
      >
        {#snippet content()}
          <InviteOrganizationMemberForm
            form_input={data.member_invite_form_input}
            on_invite={(invitiation) =>
              (invitations = [invitiation, ...invitations])}
          />
        {/snippet}
      </Card>

      <h2>Invites</h2>
      <OrganizationInvitationsTable bind:invitations />
    </div>
  {/if}
</div>
