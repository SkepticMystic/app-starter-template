<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { ROUTES } from "$lib/const/routes.const";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { onMount } from "svelte";
  import { toast } from "svelte-daisyui-toast";
  import IconFingerprint from "~icons/heroicons/finger-print";

  let {
    loader,
    redirect_uri = ROUTES.HOME,
  }: {
    redirect_uri?: string;
    loader: Loader<"signin:passkey">;
  } = $props();

  const signin = async () => {
    toast.set([]);
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
          BetterAuthClient.signIn.passkey(
            { autoFill: true },
            {
              onSuccess: () => {
                location.href = redirect_uri;
              },
            },
          );
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
    <Loading loading={$loader["signin:passkey"]}>
      <IconFingerprint />
    </Loading>
    Continue with Passkey
  </button>
</div>
