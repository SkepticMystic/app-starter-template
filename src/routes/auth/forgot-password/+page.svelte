<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { ROUTES } from "$lib/const/routes.const";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-sonner";
  import { preventDefault } from "svelte/legacy";

  let form = $state({ email: "" });

  const loader = Loader<"forgot-password">();

  const forgotPassword = async () => {
    loader.load("forgot-password");

    const res = await BetterAuthClient.requestPasswordReset({
      ...form,
      redirectTo: ROUTES.AUTH_RESET_PASSWORD,
    });

    if (res.data) {
      toast.success("Password reset email sent successfully.");
    } else {
      toast.error("Failed to send password reset email: " + res.error.message);
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
        bind:value={form.email}
      />
    </Label>
  </Fieldset>

  <button
    class="btn btn-primary w-fit"
    type="submit"
    disabled={!form.email || any_loading($loader)}
  >
    <Loading loading={$loader["forgot-password"]} />
    Send Password Reset Email
  </button>
</form>
