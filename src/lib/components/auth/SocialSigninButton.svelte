<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { ROUTES } from "$lib/const/routes.const";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";
  import Icon from "../icons/Icon.svelte";

  let {
    loader,
    provider_id,
    redirect_uri = ROUTES.HOME,
  }: {
    provider_id: IAuth.ProviderId;
    loader: Loader<`signin:${IAuth.ProviderId}`>;
    redirect_uri?: string;
  } = $props();

  const provider = AUTH.PROVIDERS.MAP[provider_id];

  const signin = async () => {
    toast.set([]);
    loader.load(`signin:${provider_id}`);

    try {
      const signin_res = await BetterAuthClient.signIn.social({
        provider: provider_id,
        callbackURL: redirect_uri,
      });

      if (signin_res.error) {
        console.warn("signin_res.error", signin_res.error);
        toast.warning(
          signin_res.error.message ?? "signin failed. Please try again.",
        );

        loader.reset();
      } else {
        console.log("signin_res.data", signin_res.data);
        // Auto redirects, no need here
        // Only reset loader if error
      }
    } catch (error) {
      toast.error("signin failed. Please try again.");
      console.error("signin error:", error);

      loader.reset();
    }
  };
</script>

<button onclick={signin} class="btn btn-info" disabled={any_loading($loader)}>
  <Loading loading={$loader[`signin:${provider_id}`]}>
    <Icon icon={provider.icon} />
  </Loading>
  Continue with {provider.name}
</button>
