<script lang="ts">
  import { dev } from "$app/env";
  import {
    PUBLIC_UMAMI_BASE_URL,
    PUBLIC_UMAMI_WEBSITE_ID,
  } from "$app/env/public";
  import SEO from "#lib/components/blocks/head/SEO.svelte";
  import NavigationProgress from "#lib/components/blocks/navbar/NavigationProgress.svelte";
  import Confirm from "#lib/components/ui/alert-dialog/Confirm.svelte";
  import Sonner from "#lib/components/ui/sonner/sonner.svelte";
  import TooltipProvider from "#lib/components/ui/tooltip/tooltip-provider.svelte";
  import { ModeWatcher } from "mode-watcher";
  import "./layout.css";

  let { children, data } = $props();

  // A primitive, so the effect below re-runs only when the user changes, not on every
  // `invalidate("app:session")`.
  const user_id = $derived(data.user?.id);

  // The id only: a name, email or IP would make analytics a store of personal
  // data, which the script's `data-do-not-track` says it is not.
  const identify_to_umami = (id: string) => {
    if (globalThis.umami) return void globalThis.umami.identify(id);

    // The script is `async`, so it may still be loading at hydration.
    document
      .querySelector("script[data-website-id]")
      ?.addEventListener("load", () => globalThis.umami?.identify(id), {
        once: true,
      });
  };

  $effect(() => {
    if (PUBLIC_UMAMI_BASE_URL && PUBLIC_UMAMI_WEBSITE_ID && user_id) {
      identify_to_umami(user_id);
    }
  });
</script>

<svelte:head>
  <!-- Svelte says to use %sveltekit.env.[NAME]%
       But at this point, there's enough js stuff that I think this is fine
       SOURCE: https://svelte.dev/docs/kit/project-structure#Project-files-tsconfig.json -->
  {#if PUBLIC_UMAMI_BASE_URL && PUBLIC_UMAMI_WEBSITE_ID}
    <script
      async
      data-do-not-track="true"
      data-tag={dev ? "dev" : "prod"}
      src="{PUBLIC_UMAMI_BASE_URL}/script.js"
      data-website-id={PUBLIC_UMAMI_WEBSITE_ID}
    ></script>
  {/if}
</svelte:head>

<!-- NOTE: Don't put this in svelte:head! It does that itself -->
<SEO />

<NavigationProgress />

<Sonner />
<!-- Answers `Confirm.ask`, which `Client.wrap` calls in place of `window.confirm`. -->
<Confirm />
<!-- The theme bootstrap is in `app.html`, under kit's CSP nonce — see `handleModeWatcher`. -->
<ModeWatcher disableHeadScriptInjection />

<!-- The provider every `Tip` needs, so one outside the authed layout's `SidebarProvider` (which
  brings its own) does not throw for the want of one. -->
<TooltipProvider>
  {@render children?.()}
</TooltipProvider>
