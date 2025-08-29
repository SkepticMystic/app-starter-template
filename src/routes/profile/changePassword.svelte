<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-sonner";
  import { preventDefault } from "svelte/legacy";

  let form = $state({
    new_password: "",
    current_password: "",
  });

  const loader = Loader<"change-pwd">();

  const changePassword = async () => {
    toast.dismiss();
    loader.load("change-pwd");

    const res = await BetterAuthClient.changePassword({
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

<form onsubmit={preventDefault(changePassword)}>
  <Fieldset legend="Change password">
    <div class="space-y-3">
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

      <button
        type="submit"
        class="btn btn-primary"
        disabled={!form.current_password ||
          !form.new_password ||
          any_loading($loader)}
      >
        <Loading loading={$loader["change-pwd"]} />
        Change Password
      </button>
    </div>
  </Fieldset>
</form>
