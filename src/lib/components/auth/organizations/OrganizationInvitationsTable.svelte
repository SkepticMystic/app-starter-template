<script lang="ts">
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Table from "$lib/components/Table.svelte";
  import Time from "$lib/components/Time.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import TableCell from "$lib/components/ui/table/table-cell.svelte";
  import TableHead from "$lib/components/ui/table/table-head.svelte";
  import {
    type IOrganization,
    ORGANIZATION,
  } from "$lib/const/organization.const";
  import { Dates } from "$lib/utils/dates";
  import { Format } from "$lib/utils/format.util";
  import { Items } from "$lib/utils/items.util";
  import { Loader } from "$lib/utils/loader";
  import { Strings } from "$lib/utils/strings.util";
  import type { Invitation } from "better-auth/plugins";

  interface Props {
    invitations: Invitation[];
  }

  let { invitations = $bindable() }: Props = $props();

  const loader = Loader<`cancel_invitation:${string}`>();

  const cancel_invitation = async (invite_id: string) => {
    loader.load(`cancel_invitation:${invite_id}`);

    const res = await OrganizationsClient.cancel_invitation(invite_id);
    if (res.ok) {
      invitations = Items.patch(invitations, invite_id, res.data);
    }

    loader.reset();
  };

  let rows = $derived(invitations);
</script>

<Table data={rows}>
  {#snippet header()}
    <TableHead>Email</TableHead>
    <TableHead>Role</TableHead>
    <TableHead>Expiry date</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Actions</TableHead>
  {/snippet}

  {#snippet row(invitation)}
    <TableCell>
      {invitation.email}
    </TableCell>

    <TableCell>
      {ORGANIZATION.ROLES.MAP[invitation.role as IOrganization.RoleId].name}
    </TableCell>

    <TableCell>
      <Time date={invitation.expiresAt} show={Dates.show_datetime} />
    </TableCell>

    <TableCell>
      {ORGANIZATION.INVITATIONS.STATUSES.MAP[invitation.status].name}
    </TableCell>

    <TableCell>
      <Button
        variant="destructive"
        icon="heroicons/x-mark"
        title="Cancel invitation"
        onclick={() => cancel_invitation(invitation.id)}
        loading={$loader[`cancel_invitation:${invitation.id}`]}
        disabled={invitation.status !== "pending" ||
          $loader[`cancel_invitation:${invitation.id}`]}
      />
    </TableCell>
  {/snippet}

  {#snippet footer()}
    <TableCell colspan={5}>
      {Format.number(rows.length)}
      {Strings.pluralize("invitation", rows.length)}
    </TableCell>
  {/snippet}
</Table>
