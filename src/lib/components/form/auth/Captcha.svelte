<script lang="ts">
  import { PUBLIC_CAPCTHA_SITE_KEY } from "$env/static/public";
  import { mode } from "mode-watcher";
  import { Turnstile } from "svelte-turnstile";

  let {
    name = "captcha_token",
  }: {
    name?: string;
  } = $props();
</script>

<Turnstile
  theme={mode.current}
  siteKey={PUBLIC_CAPCTHA_SITE_KEY}
  responseField
  responseFieldName={name}
/>
