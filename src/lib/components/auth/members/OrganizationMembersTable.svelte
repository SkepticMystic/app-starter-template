<script lang="ts">
  import type { auth } from "$lib/auth";
  import { MembersClient } from "$lib/clients/members.client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import Table from "$lib/components/Table.svelte";
  import Time from "$lib/components/Time.svelte";
  import {
    ORGANIZATION,
    type IOrganization,
  } from "$lib/const/organization.const";
  import { Format } from "$lib/utils/format.util";
  import { Loader } from "$lib/utils/loader";
  import { Strings } from "$lib/utils/strings.util";

  let {
    members = $bindable(),
  }: {
    members: Awaited<ReturnType<typeof auth.api.listMembers>>["members"];
  } = $props();

  const loader = Loader<
    `update_member_role:${string}` | `remove_member:${string}`
  >();

  const update_member_role = async (
    member_id: string,
    role_id: IOrganization.RoleId,
  ) => {
    loader.load(`update_member_role:${member_id}`);

    const res = await MembersClient.update_member_role(member_id, role_id);
    if (res.ok) {
      members = members.map((member) =>
        member.id === member_id ? { ...member, role: role_id } : member,
      );
    }

    loader.reset();

    return res;
  };

  const remove_member = async (member_id: string) => {
    loader.load(`remove_member:${member_id}`);

    const res = await MembersClient.remove_member(member_id);
    if (res.ok) {
      members = members.filter((member) => member.id !== member_id);
    }

    loader.reset();
  };

  let rows = $derived(members);
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
        <div class="flex flex-col">
          {#if member.user.name}
            <span>{member.user.name}</span>
          {/if}
          <span>{member.user.email}</span>
        </div>
      </td>

      <td>
        <select
          class="select"
          value={member.role}
          disabled={$loader[`update_member_role:${member.id}`]}
          onchange={async (e) => {
            const res = await update_member_role(
              member.id,
              e.currentTarget.value as IOrganization.RoleId,
            );
            if (!res.ok) {
              // Revert selection on error
              e.currentTarget.value = member.role;
            }
          }}
        >
          {#each ORGANIZATION.ROLES.IDS as role_id (role_id)}
            <option value={role_id}>
              {ORGANIZATION.ROLES.MAP[role_id].name}
            </option>
          {/each}
        </select>
      </td>

      <td>
        <Time date={member.createdAt} />
      </td>

      <td>
        <button
          title="Remove member"
          class="btn btn-square btn-warning"
          onclick={() => remove_member(member.id)}
          disabled={$loader[`remove_member:${member.id}`]}
        >
          <Loading loading={$loader[`remove_member:${member.id}`]}>
            <Icon class="heroicons/user-minus" />
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
