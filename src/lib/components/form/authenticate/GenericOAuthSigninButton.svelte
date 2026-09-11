<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import { BetterAuthClient } from "$lib/auth-client";
  import { Client } from "$lib/clients/index.client";
  import Button from "$lib/components/ui/button/button.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth/auth.const";

  let {
    provider_id,
    redirect_uri,
  }: {
    provider_id: IAuth.ProviderId;
    redirect_uri: ResolvedPathname | null;
  } = $props();

  const provider = $derived(AUTH.PROVIDERS.MAP[provider_id]);

  // better-auth 1.7 registers every `genericOAuth` config as a first-class
  // social provider and drops the plugin's own `/sign-in/oauth2` endpoint, so
  // this goes through `signIn.social` like any other provider. Scopes now
  // belong on the server config in `auth.ts`, not on the call.
  const signin = Client.better_auth(() =>
    BetterAuthClient.signIn.social({
      provider: provider_id,
      disableRedirect: false,
      callbackURL: redirect_uri ?? "/home",
      newUserCallbackURL: redirect_uri ?? "/onboarding",
    }),
  );
</script>

<Button
  class="w-full"
  onclick={signin}
  icon={provider.icon}
>
  Continue with {provider.name}
</Button>
