<script lang="ts">
  import CredentialSigninForm from "$lib/components/auth/authenticate/CredentialSigninForm.svelte";
  import GenericOAuthSigninButton from "$lib/components/auth/GenericOAuthSigninButton.svelte";
  import PasskeySigninButton from "$lib/components/auth/passkeys/PasskeySigninButton.svelte";
  import SocialSigninButton from "$lib/components/auth/SocialSigninButton.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { ROUTES } from "$lib/const/routes.const";
  import { Loader } from "$lib/utils/loader";

  let { data } = $props();

  const loader = Loader<`signin:${IAuth.ProviderId | "passkey"}`>();
</script>

<div class="mx-auto flex max-w-xs flex-col gap-5">
  {#if data.search.previous === "organization-invite"}
    <p class="text-success">Invite accepted, please sign in to continue.</p>
  {:else if data.search.previous === "reset-password"}
    <p class="text-success">
      Password reset successful, please sign in to continue.
    </p>
  {/if}

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

    <PasskeySigninButton {loader} redirect_uri={data.search.redirect_uri} />
  </div>

  <div class="divider">OR</div>

  <CredentialSigninForm
    {loader}
    email_hint={data.search.email_hint}
    redirect_uri={data.search.redirect_uri}
  />

  <ul>
    <li>
      <a class="link" href={ROUTES.AUTH_SIGNUP}>Signup instead</a>
    </li>

    <li>
      <a class="link" href={ROUTES.AUTH_FORGOT_PASSWORD}> Forgot password? </a>
    </li>
  </ul>
</div>
