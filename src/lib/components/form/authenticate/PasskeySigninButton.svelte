<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import { BetterAuthClient } from "#lib/auth-client.js";
  import { Client } from "#lib/clients/index.client.js";
  import Button from "#lib/components/ui/button/button.svelte";
  import { onMount } from "svelte";

  let {
    redirect_uri,
  }: {
    redirect_uri: ResolvedPathname;
  } = $props();

  const onSuccess = () => {
    location.href = redirect_uri;
  };

  const signin = Client.better_auth(() =>
    BetterAuthClient.signIn.passkey({}, { onSuccess }),
  );

  onMount(() => {
    void (async () => {
      // Conditional UI surfaces on the sign-in form's `username webauthn` email field.
      const available =
        await globalThis.PublicKeyCredential?.isConditionalMediationAvailable?.();

      if (available) {
        BetterAuthClient.signIn.passkey({ autoFill: true }, { onSuccess });
      }
    })();
  });
</script>

<Button
  class="w-full"
  onclick={signin}
  icon="lucide/fingerprint"
>
  Continue with passkey
</Button>
