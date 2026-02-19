<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { OrganizationClient } from "$lib/clients/auth/organization.client";
  import OrganizationInviteForm from "$lib/components/form/auth/organization/invitation/OrganizationInviteForm.svelte";
  import OrganizationSelector from "$lib/components/selector/OrganizationSelector.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Modal from "$lib/components/ui/modal/modal.svelte";
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
</article>
