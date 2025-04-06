<script lang="ts">
  import { preventDefault } from "svelte/legacy";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import { get_action_error_msg } from "$lib/utils/errors";
  import { any_loading, Loader } from "$lib/utils/loader";
  import type { ActionResult } from "@sveltejs/kit";
  import axios from "axios";
  import { toast } from "svelte-daisyui-toast";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";

  let email = $state("");

  const loader = Loader<"forgot-password">();

  const forgotPassword = async () => {
    loader.load("forgot-password");

    try {
      const { data } = await axios.postForm<ActionResult>("", { email });

      if (data.type === "success") {
        toast.success("Check your email for a link to reset your password.");
      } else {
        toast.warning("There was an error sending the email.");
      }
    } catch (error) {
      console.log(error);
      toast.error(get_action_error_msg(error));
    }

    loader.reset();
  };
</script>

<form onsubmit={preventDefault(forgotPassword)} class="flex flex-col gap-3">
  <Fieldset legend="Forgot password">
    <Label lbl="Email">
      <input
        class="input"
        type="email"
        placeholder="Email"
        autocomplete="email"
        bind:value={email}
      />
    </Label>
  </Fieldset>

  <button
    class="btn btn-primary w-fit"
    type="submit"
    disabled={!email || any_loading($loader)}
  >
    <Loading loading={$loader["forgot-password"]} />
    Send Password Reset Email
  </button>
</form>
