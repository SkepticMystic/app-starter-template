<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { ROUTES } from "$lib/const/routes.const";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";
  import AuthProviderIcon from "../icons/AuthProviderIcon.svelte";

  let {
    loader,
    scopes,
    provider_id,
    redirect_uri = ROUTES.HOME,
  }: {
    scopes?: string[];
    redirect_uri?: string;
    provider_id: IAuth.ProviderId;
    loader: Loader<`signin:${IAuth.ProviderId}`>;
  } = $props();

  const provider = AUTH.PROVIDERS.MAP[provider_id];

  const signin = async () => {
    toast.set([]);
    loader.load(`signin:${provider_id}`);

    try {
      const signin_res = await BetterAuthClient.signIn.oauth2({
        disableRedirect: false,
        providerId: provider_id,
        callbackURL: redirect_uri,
        scopes: scopes ?? ["openid", "profile", "email"],
      });

      if (signin_res.error) {
        console.warn(provider_id, "signin_res.error", signin_res.error);
        toast.warning(
          signin_res.error.message ?? "signin failed. Please try again.",
        );

        loader.reset();
      } else {
        console.log(provider_id, "signin_res.data", signin_res.data);
        // Auto redirects, no need here
        // Only reset loader if error
      }
    } catch (error) {
      toast.error("signin failed. Please try again.");
      console.error(provider_id, "signin error:", error);

      loader.reset();
    }
  };
</script>

<button onclick={signin} class="btn btn-info" disabled={any_loading($loader)}>
  <Loading loading={$loader[`signin:${provider_id}`]}>
    <AuthProviderIcon {provider_id} />
  </Loading>
  Continue with {provider.name}
</button>
