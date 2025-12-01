<script lang="ts">
  import { resolve } from "$app/paths";
  import CredentialSignupForm from "$lib/components/auth/authenticate/CredentialSignupForm.svelte";
  import GenericOAuthSigninButton from "$lib/components/auth/authenticate/GenericOAuthSigninButton.svelte";
  import SocialSigninButton from "$lib/components/auth/authenticate/SocialSigninButton.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { APP } from "$lib/const/app.const";
  import { AUTH } from "$lib/const/auth/auth.const";

  let { data } = $props();
</script>

<Card
  class="mx-auto w-full max-w-xs"
  title="Signup for {APP.NAME}"
>
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
      </div>

      <Separator />

      <CredentialSignupForm redirect_uri={data.search.redirect_uri} />

      <ul>
        <li>
          <Button
            size="sm"
            variant="link"
            href={resolve("/auth/signin")}
          >
            Sign in instead
          </Button>
        </li>
      </ul>
    </div>
  {/snippet}
</Card>
