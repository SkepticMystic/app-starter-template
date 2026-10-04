<script lang="ts">
  import EmailCodeRequestForm from "#lib/components/form/authenticate/EmailCodeRequestForm.svelte";
  import EmailCodeSigninForm from "#lib/components/form/authenticate/EmailCodeSigninForm.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Card from "#lib/components/ui/card/Card.svelte";
  import { EMAIL_OTP } from "#lib/const/auth/email_otp.const.js";
  import { App } from "#lib/utils/app.js";

  let { data } = $props();

  /** The address last asked for, kept to prefill a second request. */
  let email = $state("");
  /** Set once a code has been asked for: the second step. */
  let sent = $state(false);
</script>

<Card
  class="mx-auto w-full max-w-xs"
  heading="h1"
  title={sent ? "Check your email" : "Sign in with a code"}
  description={sent
    ? // The same words whether or not the address has an account.
      `If ${email} has an account, we sent it a code. It expires in ${EMAIL_OTP.EXPIRES_IN_SECONDS / 60} minutes.`
    : "We'll email you a code to sign in with, instead of a password."}
>
  {#snippet children()}
    {#if sent}
      <EmailCodeSigninForm
        {email}
        redirect_uri={data.search.redirect_uri}
      />
    {:else}
      <EmailCodeRequestForm
        {email}
        on_sent={(to) => {
          email = to;
          sent = true;
        }}
      />
    {/if}
  {/snippet}

  {#snippet footer()}
    {#if sent}
      <Button
        variant="link"
        onclick={() => (sent = false)}
      >
        Send a new code, or use another email
      </Button>
    {:else}
      <Button
        variant="link"
        href={App.url("/auth/signin", {
          redirect_uri: data.search.explicit,
        })}
      >
        Sign in another way
      </Button>
    {/if}
  {/snippet}
</Card>
