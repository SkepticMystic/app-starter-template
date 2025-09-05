<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import { Client } from "$lib/clients/index.client";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { ROUTES } from "$lib/const/routes.const";
  import { TOAST } from "$lib/const/toast.const";
  import { App } from "$lib/utils/app";
  import Button from "../ui/button/button.svelte";

  let {
    provider_id,
    redirect_uri,
  }: {
    redirect_uri?: string;
    provider_id: IAuth.ProviderId;
  } = $props();

  const provider = AUTH.PROVIDERS.MAP[provider_id];

  const signin = () =>
    Client.better_auth(
      () =>
        BetterAuthClient.signIn.oauth2({
          disableRedirect: false,
          providerId: provider_id,
          scopes: ["openid", "profile", "email"],
          callbackURL: App.url(redirect_uri ?? ROUTES.HOME, {
            toast: TOAST.IDS.SIGNED_IN,
          }),
        }),
      { validate_session: false },
    );
</script>

<Button onclick={signin} icon={provider.icon}>
  Continue with {provider.name}
</Button>
