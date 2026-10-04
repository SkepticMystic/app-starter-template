<script lang="ts">
  import CredentialSignupForm from "#lib/components/form/authenticate/CredentialSignupForm.svelte";
  import OAuthSigninButton from "#lib/components/form/authenticate/OAuthSigninButton.svelte";
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
  title="Sign up for {APP.NAME}"
>
  {#snippet children()}
    <div class="space-y-5">
      <div class="flex flex-col gap-2">
        {#each AUTH.PROVIDERS.IDS as provider_id (provider_id)}
          {#if AUTH.PROVIDERS.MAP[provider_id].is_oidc}
            <OAuthSigninButton
              {provider_id}
              redirect_uri={data.search.redirect_uri}
            />
          {/if}
        {/each}
      </div>

      <Separator />

      <CredentialSignupForm redirect_uri={data.search.redirect_uri} />

      <ul>
        <li>
          <Button
            size="sm"
            variant="link"
            href={App.url("/auth/signin", {
              redirect_uri: data.search.redirect_uri ?? undefined,
            })}
          >
            Sign in instead
          </Button>
        </li>
      </ul>
    </div>
  {/snippet}
</Card>
