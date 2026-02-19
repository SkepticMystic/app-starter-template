<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import { BetterAuthClient } from "$lib/auth-client";
  import { Client } from "$lib/clients/index.client";
  import { AUTH, type IAuth } from "$lib/const/auth/auth.const";
  import Button from "../../ui/button/button.svelte";

  let {
    provider_id,
    redirect_uri,
  }: {
    provider_id: IAuth.ProviderId;
    redirect_uri: ResolvedPathname | null;
  } = $props();

  const provider = $derived(AUTH.PROVIDERS.MAP[provider_id]);

  const signin = Client.better_auth(() =>
    BetterAuthClient.signIn.social({
      provider: provider_id,
      disableRedirect: false,
      callbackURL: redirect_uri ?? "/",
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
