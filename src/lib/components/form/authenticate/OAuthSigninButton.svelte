<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import { BetterAuthClient } from "#lib/auth-client.js";
  import { Client } from "#lib/clients/index.client.js";
  import Button from "#lib/components/ui/button/button.svelte";
  import { AUTH, type IAuth } from "#lib/const/auth/auth.const.js";

  let {
    provider_id,
    redirect_uri,
  }: {
    provider_id: IAuth.ProviderId;
    redirect_uri: ResolvedPathname | null;
  } = $props();

  const provider = $derived(AUTH.PROVIDERS.MAP[provider_id]);

  // better-auth 1.7 registers every `genericOAuth` config as a first-class
  // social provider, so social and generic OAuth both go through
  // `signIn.social`. Scopes belong on the server config in `auth.ts`.
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
