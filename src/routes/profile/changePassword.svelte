<script lang="ts">
  import { preventDefault } from "svelte/legacy";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import type { Result } from "$lib/interfaces";
  import { get_http_error_msg } from "$lib/utils/errors";
  import { any_loading, Loader } from "$lib/utils/loader";
  import axios from "axios";
  import { toast } from "svelte-daisyui-toast";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";

  let newPass = $state("");
  let confirmPass = $state("");

  const loader = Loader<"change-pwd">();

  const changePassword = async () => {
    toast.set([]);

    if (newPass !== confirmPass) return toast.warning("Passwords do not match");
    loader.load("change-pwd");

    try {
      const { data } = await axios.put<Result>("/api/user/password", {
        newPass,
      });

      if (data.ok) {
        newPass = confirmPass = "";

        toast.success("Password changed successfully");
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.log(error);
      toast.error(get_http_error_msg(error));
    }

    loader.reset();
  };
</script>

<form class="flex flex-col gap-3" onsubmit={preventDefault(changePassword)}>
  <Fieldset legend="Change password">
    <Label lbl="New Password">
      <input
        class="input"
        type="password"
        autocomplete="new-password"
        bind:value={newPass}
      />
    </Label>

    <Label lbl="Confirm Password">
      <input
        class="input"
        type="password"
        autocomplete="new-password"
        bind:value={confirmPass}
      />
    </Label>
  </Fieldset>

  <div class="flex flex-wrap items-center gap-3">
    <button
      class="btn btn-primary"
      type="submit"
      disabled={!newPass || !confirmPass || any_loading($loader)}
    >
      <Loading loading={$loader["change-pwd"]} />
      Change Password
    </button>
  </div>
</form>
