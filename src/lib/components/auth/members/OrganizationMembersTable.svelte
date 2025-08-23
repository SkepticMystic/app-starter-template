<script lang="ts">
  import type { auth } from "$lib/auth";
  import { MembersClient } from "$lib/clients/members.client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Table from "$lib/components/Table.svelte";
  import Time from "$lib/components/Time.svelte";
  import { Format } from "$lib/utils/format.util";
  import { Loader } from "$lib/utils/loader";
  import { Strings } from "$lib/utils/strings.util";
  import IconUserMinus from "~icons/heroicons/user-minus";

  let {
    members = $bindable(),
  }: {
    members: Awaited<ReturnType<typeof auth.api.listMembers>>["members"];
  } = $props();

  const loader = Loader<`remove_member:${string}`>();

  const remove_member = async (member_id: string) => {
    loader.load(`remove_member:${member_id}`);

    const res = await MembersClient.remove_member(member_id);
    if (res.ok) {
      members = members.filter((member) => member.id !== member_id);
    }

    loader.reset();
  };

  let rows = $state(members);
</script>

<Table data={rows}>
  {#snippet header()}
    <th> Name </th>
    <th> Role </th>
    <th> Join date </th>
    <th> Actions </th>
  {/snippet}

  {#snippet row(member)}
    <tr>
      <td>
        {member.user.name || member.user.email}
      </td>

      <td>
        {member.role}
      </td>

      <td>
        <Time date={member.createdAt} />
      </td>

      <td>
        <button
          title="Remove member"
          class="btn btn-square"
          onclick={() => remove_member(member.id)}
          disabled={$loader[`remove_member:${member.id}`]}
        >
          <Loading loading={$loader[`remove_member:${member.id}`]}>
            <IconUserMinus />
          </Loading>
        </button>
      </td>
    </tr>
  {/snippet}

  {#snippet footer()}
    <td colspan="4">
      {Format.number(rows.length)}
      {Strings.pluralize("member", rows.length)}
    </td>
  {/snippet}
</Table>
