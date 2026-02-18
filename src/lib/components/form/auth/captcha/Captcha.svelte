<script lang="ts">
  import { PUBLIC_CAPTCHA_SITE_KEY } from "$env/static/public";
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

<Turnstile
  theme={mode.current}
  siteKey={PUBLIC_CAPTCHA_SITE_KEY}
  responseField
  responseFieldName={name}
  bind:reset
/>
