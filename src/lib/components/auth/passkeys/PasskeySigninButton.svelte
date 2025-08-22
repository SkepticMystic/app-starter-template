<script lang="ts">
  import { goto } from "$app/navigation";
  import { BetterAuthClient } from "$lib/auth-client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { ROUTES } from "$lib/const/routes.const";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";

  let {
    email,
    loader,
  }: {
    email: string;
    loader: Loader<`signin:${IAuth.ProviderId}`>;
  } = $props();

  const provider_id: IAuth.ProviderId = "passkey";
  const provider = AUTH.PROVIDERS.MAP[provider_id];

  const signin = async () => {
    if (!email) {
      toast.error("Email is required for passkey signin.");
      return;
    }

    toast.set([]);
    loader.load(`signin:${provider_id}`);

    console.log("Starting passkey signin for email:", email);

    try {
      const signin_res = await BetterAuthClient.signIn.passkey({
        email,
        autoFill: true,
      });

      console.log("signin_res", signin_res);

      if (signin_res.error) {
        console.warn("signin_res.error", signin_res.error);
        toast.warning(
          signin_res.error.message ?? "Signin failed. Please try again.",
        );
      } else {
        console.log("signin_res.data", signin_res.data);
        await goto(ROUTES.HOME);
      }
    } catch (error) {
      toast.error("Signin failed. Please try again.");
      console.error("signin error:", error);
    }

    loader.reset();
  };
</script>

<button onclick={signin} class="btn btn-info" disabled={any_loading($loader)}>
  <Loading loading={$loader[`signin:${provider_id}`]}>
    <!-- svelte-ignore svelte_component_deprecated -->
    <svelte:component this={provider.icon} />
  </Loading>
  Continue with {provider.name}
</button>
