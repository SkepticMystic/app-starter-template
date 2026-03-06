<script lang="ts">
  import { OrganizationClient } from "$lib/clients/auth/organization.client";
  import OrganizationInviteForm from "$lib/components/form/auth/organization/invitation/OrganizationInviteForm.svelte";
  import OrganizationSelector from "$lib/components/selector/OrganizationSelector.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Item from "$lib/components/ui/item/Item.svelte";
  import Modal from "$lib/components/ui/modal/modal.svelte";
  import { member, organization } from "$lib/stores/organization.store";
  import { Arrays } from "$lib/utils/array/array.util";
  import OrganizationInvitationsTable from "./OrganizationInvitationsTable.svelte";
  import OrganizationMembersTable from "./OrganizationMembersTable.svelte";

  let { data } = $props();

  let members = $derived(data.members);
  let invitations = $derived(data.invitations);
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
    <OrganizationMembersTable
      {members}
      on_remove={(member_id) => {
        members = Arrays.remove(members, member_id);
      }}
      on_update_role={({ id, role }) => {
        members = Arrays.patch(members, id, { role });
      }}
    />
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
          <OrganizationInviteForm
            on_success={(d) => {
              close();
              invitations = Arrays.add(invitations, d);
            }}
          />
        {/snippet}
      </Modal>
    </div>

    <OrganizationInvitationsTable
      {invitations}
      on_cancel={(id) => {
        invitations = Arrays.remove(invitations, id);
      }}
    />
  </section>

  <section>
    <Item
      variant="destructive"
      title="Leave Organization"
      description="You'll no longer be able to access this organization"
    >
      {#snippet actions()}
        <Button
          variant="outline"
          icon="lucide/log-out"
          onclick={() =>
            OrganizationClient.leave(undefined, {
              on_success: () => window.location.reload(),
            })}
        >
          Leave
        </Button>
      {/snippet}
    </Item>

    {#if $member.data?.role === "owner"}
      <Item
        variant="destructive"
        title="Delete Organization"
        description="Delete this organization and all associated data"
      >
        {#snippet actions()}
          <Button
            variant="outline"
            icon="lucide/trash"
            onclick={() =>
              $organization.data &&
              OrganizationClient.delete($organization.data.id, {
                on_success: () => window.location.reload(),
              })}
          >
            Delete
          </Button>
        {/snippet}
      </Item>
    {/if}
  </section>
</article>
