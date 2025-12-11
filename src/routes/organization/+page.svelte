<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { OrganizationClient } from "$lib/clients/auth/organization.client";
  import OrganizationInvitationsTable from "$lib/components/auth/organizations/invitations/OrganizationInvitationsTable.svelte";
  import OrganizationInviteForm from "$lib/components/auth/organizations/invitations/OrganizationInviteForm.svelte";
  import OrganizationMembersTable from "$lib/components/auth/organizations/members/OrganizationMembersTable.svelte";
  import OrganizationSelector from "$lib/components/auth/organizations/OrganizationSelector.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Modal from "$lib/components/ui/modal/modal.svelte";
</script>

<article>
  <header>
    <h1>Organization</h1>
  </header>

  <section>
    <OrganizationSelector />

    <Button
      variant="destructive"
      icon="lucide/log-out"
      onclick={() =>
        OrganizationClient.leave(undefined).then((r) => {
          if (r.ok) {
            goto(resolve("/"));
          }
        })}
    >
      Leave Organization
    </Button>
  </section>

  <section>
    <h2>Members</h2>
    <OrganizationMembersTable />
  </section>

  <section>
    <div class="flex items-center justify-between">
      <h2>Invites</h2>

      <Modal
        variant="outline"
        title="Invite Member"
        description="Invite a new member to your organization"
      >
        {#snippet trigger()}
          <Icon icon="lucide/user-plus" /> Invite Member
        {/snippet}

        {#snippet content({ close })}
          <OrganizationInviteForm on_success={() => close()} />
        {/snippet}
      </Modal>
    </div>

    <OrganizationInvitationsTable />
  </section>
</article>
