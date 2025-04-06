<script lang="ts">
  import { set_href } from "$lib/auth/client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { App } from "$lib/utils/app";
  import { get_action_error_msg } from "$lib/utils/errors";
  import { any_loading, Loader } from "$lib/utils/loader";
  import type { ActionResult } from "@sveltejs/kit";
  import axios from "axios";
  import { toast } from "svelte-daisyui-toast";
  import { preventDefault } from "svelte/legacy";

  const loader = Loader<"reset-pwd">();

  let form = $state({
    new: "",
    confirm: "",
  });

  const reset_password = async () => {
    toast.set([]);

    if (form.new !== form.confirm) {
      return toast.error("Passwords do not match");
    }

    loader.load("reset-pwd");

    try {
      const { data } = await axios.postForm<ActionResult>("", form);

      if (data.type === "success") {
        toast.success("Password changed successfully");

        set_href(App.url("/auth/signin", { previous: "reset-password" }));
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.log(error);
      toast.error(get_action_error_msg(error));
    }

    loader.reset();
  };
</script>

<form onsubmit={preventDefault(reset_password)} class="flex flex-col gap-3">
  <Fieldset legend="Reset password">
    <Label lbl="New Password">
      <input
        class="input"
        type="password"
        placeholder="New Password"
        autocomplete="new-password"
        bind:value={form.new}
      />
    </Label>
    <Label lbl="Confirm Password">
      <input
        class="input"
        type="password"
        placeholder="Confirm Password"
        autocomplete="new-password"
        bind:value={form.confirm}
      />
    </Label>
  </Fieldset>

  <button
    class="btn btn-primary"
    type="submit"
    disabled={!form.new || !form.confirm || any_loading($loader)}
  >
    <Loading loading={$loader["reset-pwd"]} />
    Reset Password
  </button>
</form>
