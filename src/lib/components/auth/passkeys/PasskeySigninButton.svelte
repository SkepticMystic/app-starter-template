<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client";
  import { Client } from "$lib/clients/index.client";
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { ROUTES } from "$lib/const/routes.const";
  import { TOAST } from "$lib/const/toast.const";
  import { App } from "$lib/utils/app";
  import { onMount } from "svelte";

  let {
    redirect_uri,
  }: {
    redirect_uri?: string;
  } = $props();

  const onSuccess = () => {
    location.href = App.url(redirect_uri ?? ROUTES.HOME, {
      toast: TOAST.IDS.SIGNED_IN,
    });
  };

  const signin = () =>
    Client.better_auth(
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

<Input
  type="text"
  name="name"
  class="hidden"
  autocomplete="username webauthn"
/>
<Input
  class="hidden"
  type="password"
  name="password"
  autocomplete="current-password webauthn"
/>

<Button onclick={signin} icon="lucide/fingerprint">
  Continue with Passkey
</Button>
