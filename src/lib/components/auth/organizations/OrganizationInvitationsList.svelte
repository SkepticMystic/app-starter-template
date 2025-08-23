<script lang="ts">
  import { OrganizationsClient } from "$lib/clients/organizations.client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Table from "$lib/components/Table.svelte";
  import Time from "$lib/components/Time.svelte";
  import type { Invitation } from "$lib/models/auth/Invitation.model";
  import { Dates } from "$lib/utils/dates";
  import { Format } from "$lib/utils/format.util";
  import { Loader } from "$lib/utils/loader";
  import { Strings } from "$lib/utils/strings.util";
  import IconXMark from "~icons/heroicons/x-mark";

  interface Props {
    invitations: Invitation[];
  }

  let { invitations = $bindable() }: Props = $props();

  const loader = Loader<`cancel_invitation:${string}`>();

  const cancel_invitation = async (invite_id: string) => {
    loader.load(`cancel_invitation:${invite_id}`);

    const res = await OrganizationsClient.cancel_invitation(invite_id);
    if (res.ok) {
      invitations = invitations.map((inv) =>
        inv.id === invite_id ? { ...inv, ...res.data } : inv,
      );
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
        {invitation.role}
      </td>

      <td>
        <Time date={invitation.expiresAt} show={Dates.show_datetime} />
      </td>

      <td> {invitation.status} </td>

      <td>
        <button
          class="btn btn-square"
          title="Cancel invitation"
          onclick={() => cancel_invitation(invitation.id)}
          disabled={invitation.status !== "pending" ||
            $loader[`cancel_invitation:${invitation.id}`]}
        >
          <Loading loading={$loader[`cancel_invitation:${invitation.id}`]}>
            <IconXMark />
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
