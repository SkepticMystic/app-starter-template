<script lang="ts">
  import CredentialSignupForm from "$lib/components/auth/authenticate/CredentialSignupForm.svelte";
  import GenericOAuthSigninButton from "$lib/components/auth/GenericOAuthSigninButton.svelte";
  import SocialSigninButton from "$lib/components/auth/SocialSigninButton.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { ROUTES } from "$lib/const/routes.const";
  import { Loader } from "$lib/utils/loader";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const loader = Loader<
    `signup:${IAuth.ProviderId}` | `signin:${IAuth.ProviderId}`
  >();
</script>

<div class="mx-auto flex max-w-xs flex-col gap-5">
  <div class="flex flex-col gap-2">
    {#each AUTH.PROVIDERS.IDS as provider_id (provider_id)}
      {@const { is_social, is_oidc } = AUTH.PROVIDERS.MAP[provider_id]}

      {#if is_oidc}
        {#if is_social}
          <SocialSigninButton
            {loader}
            {provider_id}
            redirect_uri={data.search.redirect_uri}
          />
        {:else}
          <GenericOAuthSigninButton
            {loader}
            {provider_id}
            redirect_uri={data.search.redirect_uri}
          />
        {/if}
      {/if}
    {/each}
  </div>

  <div class="divider">OR</div>

  <CredentialSignupForm
    {loader}
    email_hint={data.search.email_hint}
    redirect_uri={data.search.redirect_uri}
  />

  <ul>
    <li>
      <a class="link" href={ROUTES.AUTH_SIGNIN}>Sign in instead</a>
    </li>
  </ul>
</div>
