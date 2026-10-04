<script lang="ts">
  import { goto, invalidate } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import Header from "#lib/components/ui/header/Header.svelte";
  import { OrganizationClient } from "#lib/clients/auth/organization.client.js";
  import OrganizationInviteForm from "#lib/components/form/auth/organization/invitation/OrganizationInviteForm.svelte";
  import OrganizationSelector from "#lib/components/selector/OrganizationSelector.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Icon from "#lib/components/ui/icon/Icon.svelte";
  import Item from "#lib/components/ui/item/Item.svelte";
  import Modal from "#lib/components/ui/modal/modal.svelte";
  import { Arrays } from "#lib/utils/array/array.util.js";
  import { can } from "#lib/utils/auth/permission.util.js";
  import OrganizationInvitationsTable from "./OrganizationInvitationsTable.svelte";
  import OrganizationMembersTable from "./OrganizationMembersTable.svelte";

  let { data } = $props();

  let members = $derived(data.members);
  let invitations = $derived(data.invitations);

  // The org is gone from this session, so the session must be re-read before
  // onboarding decides where to send the user.
  const after_exit = async () => {
    await invalidate("app:session");
    await goto(resolve("/(marketing)/onboarding"));
  };
</script>

<article>
  <Header title="Organization" />

  <section>
    <h2>Active organization</h2>
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

      {#if can({ invitation: ["create"] })}
        <Modal
          variant="outline"
          title="Invite member"
          description="Invite a new member to your organization"
        >
          {#snippet trigger()}
            <Icon icon="lucide/user-plus" /> Invite member
          {/snippet}

          {#snippet content({ close })}
            <OrganizationInviteForm
              on_success={(d) => {
                close();

                /**
                 * Drop any pending invite already held by this address before
                 * adding the new one. `cancelPendingInvitationsOnReInvite` is on
                 * server-side, so the old row IS cancelled — but nothing told the
                 * table, which went on rendering two live-looking invites for one
                 * person until a reload.
                 */
                invitations = [
                  ...invitations.filter(
                    (i) =>
                      !(
                        i.status === "pending" &&
                        i.email.toLowerCase() === d.email.toLowerCase()
                      ),
                  ),
                  d,
                ];
              }}
            />
          {/snippet}
        </Modal>
      {/if}
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
      title="Leave organization"
      description="You'll no longer be able to access this organization"
    >
      {#snippet actions()}
        <Button
          variant="outline"
          icon="lucide/log-out"
          onclick={() =>
            OrganizationClient.leave(page.data.org?.id, {
              on_success: after_exit,
            })}
        >
          Leave
        </Button>
      {/snippet}
    </Item>

    {#if can({ organization: ["delete"] })}
      <Item
        variant="destructive"
        title="Delete organization"
        description="Delete this organization and all associated data"
      >
        {#snippet actions()}
          <Button
            variant="outline"
            icon="lucide/trash"
            onclick={() =>
              page.data.org &&
              OrganizationClient.delete(page.data.org.id, {
                on_success: after_exit,
              })}
          >
            Delete
          </Button>
        {/snippet}
      </Item>
    {/if}
  </section>
</article>
