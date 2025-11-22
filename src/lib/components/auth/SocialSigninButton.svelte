<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import { BetterAuthClient } from "$lib/auth-client";
  import { Client } from "$lib/clients/index.client";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { TOAST } from "$lib/const/toast.const";
  import { App } from "$lib/utils/app";
  import Button from "../ui/button/button.svelte";

  let {
    provider_id,
    redirect_uri,
  }: {
    provider_id: IAuth.ProviderId;
    redirect_uri?: ResolvedPathname;
  } = $props();

  const provider = AUTH.PROVIDERS.MAP[provider_id];

  const signin = () =>
    Client.better_auth(
      () =>
        BetterAuthClient.signIn.social({
          provider: provider_id,
          disableRedirect: false,
          callbackURL: App.url(redirect_uri ?? "/", {
            toast: TOAST.IDS.SIGNED_IN,
          }),
        }),
      { validate_session: false },
    );
</script>

<Button
  class="w-full"
  onclick={signin}
  icon={provider.icon}
>
  Continue with {provider.name}
</Button>
