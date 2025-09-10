<script lang="ts">
  import { BetterAuthClient } from "$lib/auth-client.js";
  import CredentialSigninForm from "$lib/components/auth/authenticate/CredentialSigninForm.svelte";
  import GenericOAuthSigninButton from "$lib/components/auth/GenericOAuthSigninButton.svelte";
  import PasskeySigninButton from "$lib/components/auth/passkeys/PasskeySigninButton.svelte";
  import SocialSigninButton from "$lib/components/auth/SocialSigninButton.svelte";
  import Badge from "$lib/components/ui/badge/badge.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { APP } from "$lib/const/app";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { ROUTES } from "$lib/const/routes.const";

  let { data } = $props();

  const last_method = BetterAuthClient.getLastUsedLoginMethod();
  console.log("last_method", last_method);
</script>

<Card class="mx-auto w-full max-w-xs" title="Signin to {APP.NAME}">
  {#snippet content()}
    <div class="space-y-5">
      <div class="flex flex-col gap-2">
        {#each AUTH.PROVIDERS.IDS as provider_id (provider_id)}
          {@const { is_social, is_oidc } = AUTH.PROVIDERS.MAP[provider_id]}

          {#if is_oidc}
            {#if is_social}
              <SocialSigninButton
                {provider_id}
                redirect_uri={data.search.redirect_uri}
              />
            {:else}
              <GenericOAuthSigninButton
                {provider_id}
                redirect_uri={data.search.redirect_uri}
              />
            {/if}
          {/if}
        {/each}

        <PasskeySigninButton redirect_uri={data.search.redirect_uri} />
      </div>

      {#if last_method}
        {@const provider = AUTH.PROVIDERS.MAP[last_method as IAuth.ProviderId]}

        {#if provider}
          <div class="flex w-full justify-center">
            <Badge variant="outline">
              Last signed in with {provider.name}
            </Badge>
          </div>
        {/if}
      {/if}

      <Separator />

      <CredentialSigninForm form_input={data.form_input} />

      <ul>
        <li>
          <Button size="sm" variant="link" href={ROUTES.AUTH_FORGOT_PASSWORD}>
            Forgot password?
          </Button>
        </li>

        <li>
          <Button size="sm" variant="link" href={ROUTES.AUTH_SIGNUP}>
            Don't have an account? Sign up
          </Button>
        </li>
      </ul>
    </div>
  {/snippet}
</Card>
