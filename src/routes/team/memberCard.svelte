<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { ROLES } from "$lib/auth/roles";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import type { Result, SID } from "$lib/interfaces";
  import { user } from "$lib/stores/user";
  import { get_http_error_msg } from "$lib/utils/errors";
  import { any_loading, Loader } from "$lib/utils/loader";
  import axios from "axios";
  import type { User } from "lucia";
  import { toast } from "svelte-daisyui-toast";

  interface Props {
    member: SID<Pick<User, "email" | "role">>;
  }

  let { member }: Props = $props();

  const loader = Loader<
    "remove_member" | "change_role" | "transfer_ownership"
  >();

  const member_is_user = $user?.userId === member._id;

  let newRole = $state(member.role.slice());

  const remove_member = async () => {
    if (
      !confirm(`Are you sure you want to remove ${member.email} from the team?`)
    ) {
      return;
    }

    loader.load("remove_member");

    try {
      const { data } = await axios.delete<Result>(
        `/api/team/member/${member._id}`,
      );

      if (data.ok) {
        await invalidateAll();

        toast.success("Member removed from team");
      }
    } catch (error) {
      console.log(error);
      toast.error(get_http_error_msg(error));
    }

    loader.reset();
  };

  const change_role = async () => {
    if (!confirm(`Are you sure you want to change ${member.email}'s role?`)) {
      newRole = member.role;
      return;
    }

    loader.load("change_role");

    try {
      const { data } = await axios.put<Result>(
        `/api/team/member/${member._id}/role`,
        { newRole },
      );

      if (data.ok) {
        await invalidateAll();

        toast.success("Member role changed");
      }
    } catch (error) {
      console.log(error);
      toast.error(get_http_error_msg(error));
    }

    loader.reset();
  };

  const transfer_ownership = async () => {
    if (!confirm(`Are you sure you want to make ${member.email} the owner?`)) {
      newRole = member.role;
      return;
    }

    loader.load("transfer_ownership");

    try {
      const { data } = await axios.put<Result>(
        `/api/team/member/${member._id}/transfer_ownership`,
      );

      if (data.ok) {
        // Must hard reload for auth changes to take effect
        location.reload();

        toast.success("Ownership transferred");
      }
    } catch (error) {
      console.log(error);
      toast.error(get_http_error_msg(error));
    }

    loader.reset();
  };
</script>

<div
  class="rounded-box bg-base-100 flex min-w-[200px] flex-col gap-3 border p-3"
>
  <span class="text-sm" class:font-semibold={member_is_user}
    >{member.email}</span
  >
  <span class="text-sm capitalize">
    {member.role === "owner" ? "👑" : ""}
    {member.role}
  </span>

  <div class="flex items-end gap-2">
    <Label lbl="Change Role">
      <select class="select" disabled={member_is_user} bind:value={newRole}>
        {#each ROLES.filter((r) => r != "owner") as role}
          <option value={role}>{role}</option>
        {/each}
      </select>
    </Label>

    <button
      class="btn btn-secondary"
      disabled={newRole === member.role ||
        member_is_user ||
        any_loading($loader)}
      onclick={change_role}
    >
      <Loading loading={$loader["change_role"]}>Change</Loading>
    </button>
  </div>

  <button
    class="btn btn-warning"
    disabled={$user?.role !== "owner" || member_is_user || any_loading($loader)}
    onclick={transfer_ownership}
  >
    <Loading loading={$loader["transfer_ownership"]}>
      Transfer Ownership
    </Loading>
  </button>

  <button
    class="btn btn-error"
    disabled={member_is_user || any_loading($loader)}
    onclick={remove_member}
  >
    <Loading loading={$loader["remove_member"]}>Remove</Loading>
  </button>
</div>
