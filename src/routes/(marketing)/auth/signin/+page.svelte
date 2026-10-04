<script lang="ts">
  import { resolve } from "$app/paths";
  import CredentialSigninForm from "#lib/components/form/authenticate/CredentialSigninForm.svelte";
  import OAuthSigninButton from "#lib/components/form/authenticate/OAuthSigninButton.svelte";
  import PasskeySigninButton from "#lib/components/form/authenticate/PasskeySigninButton.svelte";
  import Badge from "#lib/components/ui/badge/badge.svelte";
  import ButtonGroup from "#lib/components/ui/button-group/button-group.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Card from "#lib/components/ui/card/Card.svelte";
  import Separator from "#lib/components/ui/separator/separator.svelte";
  import { APP } from "#lib/const/app.const.js";
  import { AUTH } from "#lib/const/auth/auth.const.js";
  import { App } from "#lib/utils/app.js";

  let { data } = $props();
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

        <ButtonGroup class="w-full">
          <Button
            class="w-full"
            icon="lucide/mail"
            href={App.url("/auth/signin/code", {
              redirect_uri: data.search.explicit,
            })}
          >
            Email me a sign-in code
          </Button>
        </ButtonGroup>
      </ButtonGroup>

      {#if data.last_method}
        <div class="flex w-full justify-center">
          <Badge variant="outline">
            Last signed in with {AUTH.sign_in_method_label(data.last_method)}
          </Badge>
        </div>
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
