<script lang="ts">
  import { browser, dev } from "$app/environment";
  import { page } from "$app/state";
  import {
      PUBLIC_UMAMI_BASE_URL,
      PUBLIC_UMAMI_WEBSITE_ID
  } from "$env/static/public";
  import FooterBlock from "$lib/components/blocks/footer/FooterBlock.svelte";
  import Navbar from "$lib/components/shell/Navbar.svelte";
  import SEO from "$lib/components/shell/SEO.svelte";
  import FlashAlert from "$lib/components/ui/alert/FlashAlert.svelte";
  import Sonner from "$lib/components/ui/sonner/sonner.svelte";
  import { session } from "$lib/stores/session.store";
  import { partytownSnippet } from "@qwik.dev/partytown/integration";
  import { ModeWatcher } from "mode-watcher";
  import { getFlash } from 'sveltekit-flash-message';
  import "./layout.css";

  let { children } = $props();

  const flash = getFlash(page);

  // NOTE: Currently this listener is _just_ for umami analytics
  // We unsub as soon as they're identified
  const session_listener = session.listen(($session) => {
    if ($session.isRefetching || $session.isPending) {
      return;
    } else {
      console.log("$session loaded", $session.data);
  
      if (browser && window.umami && $session.data?.user) {
        window.umami.identify($session.data.user.id, {
          name: $session.data.user.name,
          email: $session.data.user.email,
          session_id: $session.data.session.id,
          ip_address: $session.data.session.ipAddress,
          user_agent: $session.data.session.userAgent,
          org_id: $session.data.session.activeOrganizationId,
        });

        session_listener();
      }
    }
  });
</script>

<svelte:head>
  <script>
    partytown = {
      forward: ["umami.identify"],
    };
  </script>

  {@html "<script>" + partytownSnippet() + "</script>"}

  <SEO />

  <!-- Svelte says to use %sveltekit.env.[NAME]%
       But at this point, there's enough js stuff that I think this is fine
       SOURCE: https://svelte.dev/docs/kit/project-structure#Project-files-tsconfig.json -->
  {#if PUBLIC_UMAMI_BASE_URL && PUBLIC_UMAMI_WEBSITE_ID}
    <script
      defer
      async
      type="text/partytown"
      data-do-not-track="true"
      data-tag={dev ? "dev" : "prod"}
      src="{PUBLIC_UMAMI_BASE_URL}/script.js"
      data-website-id={PUBLIC_UMAMI_WEBSITE_ID}
    ></script>
  {/if}

</svelte:head>

<Sonner />
<ModeWatcher />

<div class="flex min-h-screen flex-col">
  <header>
    <Navbar />
  </header>

  <main class="mx-auto mt-1 mb-12 w-full max-w-4xl grow px-2 sm:px-3 md:px-5">
    <FlashAlert flash={$flash} />
    
    {@render children?.()}
  </main>

  <FooterBlock />
</div>

