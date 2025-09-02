<script lang="ts">
  import type { auth } from "$lib/auth";
  import { MembersClient } from "$lib/clients/members.client";
  import Table from "$lib/components/Table.svelte";
  import Time from "$lib/components/Time.svelte";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Select from "$lib/components/ui/select/SingleSelect.svelte";
  import TableCell from "$lib/components/ui/table/table-cell.svelte";
  import TableHead from "$lib/components/ui/table/table-head.svelte";
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
    <TableHead>Name</TableHead>
    <TableHead>Role</TableHead>
    <TableHead>Join date</TableHead>
    <TableHead>Actions</TableHead>
  {/snippet}

  {#snippet row(member)}
    <TableCell>
      <div class="flex items-center gap-2">
        <UserAvatar class="size-9" user={member.user} />

        <div class="flex flex-col">
          {#if member.user.name}
            <strong>{member.user.name}</strong>
          {/if}
          <span>{member.user.email}</span>
        </div>
      </div>
    </TableCell>

    <TableCell>
      <Select
        value={member.role}
        options={ORGANIZATION.ROLES.OPTIONS}
        loading={$loader[`update_member_role:${member.id}`]}
        on_value_select={(value) => {
          if (!value || value === member.role) return;
          update_member_role(member.id, value as IOrganization.RoleId);
        }}
      ></Select>
    </TableCell>

    <TableCell>
      <Time date={member.createdAt} />
    </TableCell>

    <TableCell>
      <Button
        title="Remove member"
        variant="destructive"
        icon="heroicons/user-minus"
        onclick={() => remove_member(member.id)}
        loading={$loader[`remove_member:${member.id}`]}
      />
    </TableCell>
  {/snippet}

  {#snippet footer()}
    <TableCell colspan={4}>
      {Format.number(rows.length)}
      {Strings.pluralize("member", rows.length)}
    </TableCell>
  {/snippet}
</Table>
