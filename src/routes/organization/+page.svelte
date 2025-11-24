<script lang="ts">
  import OrganizationMembersList from "$lib/components/auth/members/OrganizationMembersTable.svelte";
  import InviteOrganizationMemberForm from "$lib/components/auth/organizations/InviteOrganizationMemberForm.svelte";
  import OrganizationInvitationsTable from "$lib/components/auth/organizations/OrganizationInvitationsTable.svelte";
  import OrganizationSelector from "$lib/components/auth/organizations/OrganizationSelector.svelte";
  import Dialog from "$lib/components/ui/dialog/dialog.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
</script>

<article>
  <header>
    <h1>Organization</h1>
  </header>

  <section>
    <OrganizationSelector />
  </section>

  <section>
    <h2>Members</h2>
    <OrganizationMembersList />
  </section>

  <section>
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
          <InviteOrganizationMemberForm on_success={() => close()} />
        {/snippet}
      </Dialog>
    </div>

    <OrganizationInvitationsTable />
  </section>
</article>
