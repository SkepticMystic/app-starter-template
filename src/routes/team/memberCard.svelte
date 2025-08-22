<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { BetterAuthClient } from "$lib/auth-client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import type { Member } from "$lib/models/auth/Member.model";
  import { user } from "$lib/stores/session";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";

  interface Props {
    member: Member;
  }

  let { member }: Props = $props();

  const loader = Loader<
    "remove_member" | "change_role" | "transfer_ownership"
  >();

  const member_is_user = $user?.id === member.userId;

  let new_role = $state(member.role.slice());

  const remove_member = async () => {
    if (!confirm(`Are you sure you want to remove this member from the org?`)) {
      return;
    }

    loader.load("remove_member");

    const res = await BetterAuthClient.organization.removeMember({
      memberIdOrEmail: member.id,
    });

    if (res.data) {
      toast.success("Member removed");
      await invalidateAll();
    } else {
      console.warn("Failed to remove member:", res.error);
      toast.error("Failed to remove member: " + res.error.message);
    }

    loader.reset();
  };
</script>

<div
  class="rounded-box bg-base-100 flex min-w-[200px] flex-col gap-3 border p-3"
>
  <span class="text-sm" class:font-semibold={member_is_user}>
    {member.id}
  </span>

  <span class="text-sm capitalize">
    {member.role === "owner" ? "👑" : ""}
    {member.role}
  </span>

  <!--
  <div class="flex items-end gap-2">
     <Label lbl="Change Role">
      <select class="select" disabled={member_is_user} bind:value={new_role}>
        {#each ROLES.filter((r) => r != "owner") as role}
          <option value={role}>{role}</option>
        {/each}
      </select>
    </Label>
     
    <button
      class="btn btn-secondary"
      disabled={new_role === member.role ||
        member_is_user ||
        any_loading($loader)}
      onclick={change_role}
    >
      <Loading loading={$loader["change_role"]}>Change</Loading>
    </button> 
  </div>
  -->

  <!-- 
  <button
    class="btn btn-warning"
    disabled={$user?.role !== "owner" || member_is_user || any_loading($loader)}
    onclick={transfer_ownership}
  >
    <Loading loading={$loader["transfer_ownership"]}>
      Transfer Ownership
    </Loading>
  </button> -->

  <button
    class="btn btn-error"
    disabled={member_is_user || any_loading($loader)}
    onclick={remove_member}
  >
    <Loading loading={$loader["remove_member"]}>Remove</Loading>
  </button>
</div>
