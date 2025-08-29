<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { ROUTES } from "$lib/const/routes.const.js";
  import { TOAST } from "$lib/const/toast.const.js";
  import { App } from "$lib/utils/app.js";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-sonner";
  import { preventDefault } from "svelte/legacy";

  let { data } = $props();

  const loader = Loader<"reset-pwd">();

  let form = $state({
    new_password: "",
  });

  const reset_password = async () => {
    if (data.search.error) {
      return;
    }

    toast.dismiss();
    loader.load("reset-pwd");

    const res = await BetterAuthClient.resetPassword({
      token: data.search.token,
      newPassword: form.new_password,
    });
    if (res.data) {
      // Hard reload. auth config will revoke all sessions
      location.href = App.url(ROUTES.AUTH_SIGNIN, {
        toast: TOAST.IDS.PASSWORD_RESET,
      });
    } else {
      toast.error("Failed to reset password: " + res.error.message);
    }

    loader.reset();
  };
</script>

{#if data.search.token}
  <form onsubmit={preventDefault(reset_password)} class="flex flex-col gap-3">
    <Fieldset legend="Reset password">
      <Label lbl="New Password">
        <input
          class="input"
          type="password"
          placeholder="New Password"
          autocomplete="new-password"
          bind:value={form.new_password}
        />
      </Label>
    </Fieldset>

    <button
      class="btn btn-primary"
      type="submit"
      disabled={!form.new_password || any_loading($loader)}
    >
      <Loading loading={$loader["reset-pwd"]} />
      Reset Password
    </button>
  </form>
{:else}
  <div class="alert alert-error">
    <span>Invalid or missing reset token.</span>
  </div>
{/if}
