<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import { BetterAuthClient } from "$lib/auth-client";
  import { Client } from "$lib/clients/index.client";
  import Button from "$lib/components/ui/button/button.svelte";
  import { onMount } from "svelte";

  let {
    redirect_uri,
  }: {
    redirect_uri: ResolvedPathname;
  } = $props();

  const onSuccess = () => {
    location.href = redirect_uri;
  };

  const signin = Client.better_auth(
    () => BetterAuthClient.signIn.passkey({}, { onSuccess }),
    { validate_session: false },
  );

  onMount(() => {
    PublicKeyCredential?.isConditionalMediationAvailable?.().then(
      (available) => {
        if (available) {
          BetterAuthClient.signIn.passkey({ autoFill: true }, { onSuccess });
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
  class="w-full"
  onclick={signin}
  icon="lucide/fingerprint"
>
  Continue with Passkey
</Button>
