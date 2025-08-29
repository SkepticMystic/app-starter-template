<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { ROUTES } from "$lib/const/routes.const";
  import { TOAST } from "$lib/const/toast.const";
  import { App } from "$lib/utils/app";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";

  let {
    loader,
    redirect_uri,
  }: {
    redirect_uri?: string;
    loader: Loader<"signin:passkey">;
  } = $props();

  const resolved_redirect_uri = App.url(redirect_uri ?? ROUTES.HOME, {
    toast: TOAST.IDS.SIGNED_IN,
  });

  const signin = async () => {
    toast.dismiss();
    loader.load("signin:passkey");

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
        location.href = resolved_redirect_uri;
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
          BetterAuthClient.signIn.passkey(
            { autoFill: true },
            {
              onSuccess: () => {
                location.href = resolved_redirect_uri;
              },
            },
          );
        }
      },
    );
  });
</script>

<input
  type="text"
  name="name"
  class="hidden"
  autocomplete="username webauthn"
/>
<input
  class="hidden"
  type="password"
  name="password"
  autocomplete="current-password webauthn"
/>

<Button
  onclick={signin}
  disabled={any_loading($loader)}
  loading={$loader["signin:passkey"]}
>
  <Icon icon="heroicons/finger-print" />
  Continue with Passkey
</Button>
