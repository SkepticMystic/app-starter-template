<script lang="ts">
  import { resolve } from "$app/paths";
  import { BetterAuthClient } from "#lib/auth-client.js";
  import CredentialSigninForm from "#lib/components/form/authenticate/CredentialSigninForm.svelte";
  import OAuthSigninButton from "#lib/components/form/authenticate/OAuthSigninButton.svelte";
  import PasskeySigninButton from "#lib/components/form/authenticate/PasskeySigninButton.svelte";
  import Badge from "#lib/components/ui/badge/badge.svelte";
  import ButtonGroup from "#lib/components/ui/button-group/button-group.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Card from "#lib/components/ui/card/Card.svelte";
  import Separator from "#lib/components/ui/separator/separator.svelte";
  import { APP } from "#lib/const/app.const.js";
  import { AUTH, type IAuth } from "#lib/const/auth/auth.const.js";
  import { App } from "#lib/utils/app.js";

  let { data } = $props();

  const last_method = BetterAuthClient.getLastUsedLoginMethod();
</script>

<Card
  class="mx-auto w-full max-w-xs"
  heading="h1"
  title="Sign in to {APP.NAME}"
>
  {#snippet children()}
    <div class="space-y-5">
      <ButtonGroup
        class="w-full"
        orientation="vertical"
      >
        {#each AUTH.PROVIDERS.IDS as provider_id (provider_id)}
          {#if AUTH.PROVIDERS.MAP[provider_id].is_oidc}
            <ButtonGroup class="w-full">
              <OAuthSigninButton
                {provider_id}
                redirect_uri={data.search.redirect_uri}
              />
            </ButtonGroup>
          {/if}
        {/each}

        <ButtonGroup class="w-full">
          <PasskeySigninButton redirect_uri={data.search.redirect_uri} />
        </ButtonGroup>
      </ButtonGroup>

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

      <CredentialSigninForm redirect_uri={data.search.redirect_uri} />

      <ButtonGroup orientation="vertical">
        <ButtonGroup>
          <Button
            variant="link"
            href={resolve("auth/forgot-password")}
          >
            Forgot password?
          </Button>
        </ButtonGroup>

        <ButtonGroup>
          <Button
            variant="link"
            href={App.url("/auth/signup", {
              redirect_uri: data.search.explicit,
            })}
          >
            Don't have an account? Sign up
          </Button>
        </ButtonGroup>
      </ButtonGroup>
    </div>
  {/snippet}
</Card>
