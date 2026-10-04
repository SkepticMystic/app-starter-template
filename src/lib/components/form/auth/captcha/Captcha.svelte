<script lang="ts">
  import { dev } from "$app/env";
  import { PUBLIC_CAPTCHA_SITE_KEY } from "$app/env/public";
  import { mode } from "mode-watcher";
  import { Turnstile } from "svelte-turnstile";

  let {
    reset = $bindable(),
    name = "captcha_token",
  }: {
    name?: string;
    reset?: () => void;
  } = $props();
</script>

<!-- Without a site key Turnstile renders a dead widget and the server rejects every submit. -->
{#if PUBLIC_CAPTCHA_SITE_KEY}
  <Turnstile
    theme={mode.current}
    siteKey={PUBLIC_CAPTCHA_SITE_KEY}
    responseField
    responseFieldName={name}
    bind:reset
  />
{:else}
  <p
    role="alert"
    class="text-sm text-destructive"
  >
    {#if dev}
      Captcha is not configured, so this form cannot be submitted. Set
      PUBLIC_CAPTCHA_SITE_KEY.
    {:else}
      This form is unavailable right now. Please try again later.
    {/if}
  </p>
{/if}
