<script lang="ts">
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import Table from "$lib/components/Table.svelte";
  import Time from "$lib/components/Time.svelte";
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
    <th> Email </th>
    <th> Role </th>
    <th> Expiry date </th>
    <th> Status </th>
    <th> Actions </th>
  {/snippet}

  {#snippet row(invitation)}
    <tr>
      <td>
        {invitation.email}
      </td>

      <td>
        {ORGANIZATION.ROLES.MAP[invitation.role as IOrganization.RoleId].name}
      </td>

      <td>
        <Time date={invitation.expiresAt} show={Dates.show_datetime} />
      </td>

      <td> {ORGANIZATION.INVITATIONS.STATUSES.MAP[invitation.status].name} </td>

      <td>
        <button
          title="Cancel invitation"
          class="btn btn-square btn-warning"
          onclick={() => cancel_invitation(invitation.id)}
          disabled={invitation.status !== "pending" ||
            $loader[`cancel_invitation:${invitation.id}`]}
        >
          <Loading loading={$loader[`cancel_invitation:${invitation.id}`]}>
            <Icon class="heroicons/x-mark" />
          </Loading>
        </button>
      </td>
    </tr>
  {/snippet}

  {#snippet footer()}
    <td colspan="5">
      {Format.number(rows.length)}
      {Strings.pluralize("invitation", rows.length)}
    </td>
  {/snippet}
</Table>
