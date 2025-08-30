<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
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
      <Input
        type="email"
        placeholder="Email"
        autocomplete="email"
        bind:value={form.email}
      />
    </Label>
  </Fieldset>

  <Button
    type="submit"
    icon="heroicons/envelope"
    loading={$loader["forgot-password"]}
    disabled={!form.email || any_loading($loader)}
  >
    Send Password Reset Email
  </Button>
</form>
