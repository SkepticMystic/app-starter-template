<script lang="ts">
  import { AuthClient } from "$lib/auth-client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";
  import { preventDefault } from "svelte/legacy";

  let form = $state({
    new_password: "",
    current_password: "",
  });

  const loader = Loader<"change-pwd">();

  const changePassword = async () => {
    toast.set([]);
    loader.load("change-pwd");

    const res = await AuthClient.changePassword({
      revokeOtherSessions: true,
      newPassword: form.new_password,
      currentPassword: form.current_password,
    });

    if (res.data) {
      toast.success("Password changed successfully.");
    } else {
      toast.error("Failed to change password: " + res.error.message);
    }

    loader.reset();
  };
</script>

<form class="flex flex-col gap-3" onsubmit={preventDefault(changePassword)}>
  <Fieldset legend="Change password">
    <Label lbl="Current Password">
      <input
        class="input"
        type="password"
        autocomplete="current-password"
        bind:value={form.current_password}
      />
    </Label>

    <Label lbl="Confirm Password">
      <input
        class="input"
        type="password"
        autocomplete="new-password"
        bind:value={form.new_password}
      />
    </Label>
  </Fieldset>

  <div class="flex flex-wrap items-center gap-3">
    <button
      class="btn btn-primary"
      type="submit"
      disabled={!form.current_password ||
        !form.new_password ||
        any_loading($loader)}
    >
      <Loading loading={$loader["change-pwd"]} />
      Change Password
    </button>
  </div>
</form>
