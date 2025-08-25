<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { ROUTES } from "$lib/const/routes.const";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { onMount } from "svelte";
  import { toast } from "svelte-daisyui-toast";

  let {
    loader,
    redirect_uri = ROUTES.HOME,
  }: {
    redirect_uri?: string;
    loader: Loader<`signin:${IAuth.ProviderId}`>;
  } = $props();

  const provider_id: IAuth.ProviderId = "passkey";
  const provider = AUTH.PROVIDERS.MAP[provider_id];

  const signin = async () => {
    toast.set([]);
    loader.load(`signin:${provider_id}`);

    console.log("Starting passkey signin");

    try {
      const signin_res = await BetterAuthClient.signIn.passkey({});
      console.log("signin_res", signin_res);

      if (signin_res.error) {
        console.warn("signin_res.error", signin_res.error);
        toast.warning(
          signin_res.error.message ?? "Signin failed. Please try again.",
        );
      } else {
        console.log("signin_res.data", signin_res.data);

        // NOTE: It seems like signIn.passkey doesn't refresh the session store
        // Whereas signIn.email does, so we can just goto, instead of hard refresh
        location.href = redirect_uri;
      }
    } catch (error) {
      toast.error("Signin failed. Please try again.");
      console.error("signin error:", error);
    }

    loader.reset();
  };

  onMount(() => {
    PublicKeyCredential?.isConditionalMediationAvailable?.().then(
      (available) => {
        if (available) {
          console.log("Conditional UI is available for passkeys");
          void BetterAuthClient.signIn.passkey({ autoFill: true });
        }
      },
    );
  });
</script>

<div>
  <input
    class="hidden"
    type="text"
    name="name"
    autocomplete="username webauthn"
  />
  <input
    class="hidden"
    type="password"
    name="password"
    autocomplete="current-password webauthn"
  />

  <button
    onclick={signin}
    class="btn btn-info w-full"
    disabled={any_loading($loader)}
  >
    <Loading loading={$loader[`signin:${provider_id}`]}>
      <!-- svelte-ignore svelte_component_deprecated -->
      <svelte:component this={provider.icon} />
    </Loading>
    Continue with {provider.name}
  </button>
</div>
