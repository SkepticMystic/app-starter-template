<script lang="ts">
  import { browser, dev } from "$app/environment";
  import {
    PUBLIC_UMAMI_BASE_URL,
    PUBLIC_UMAMI_WEBSITE_ID,
  } from "$env/static/public";
  import Navbar from "$lib/components/Navbar.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { session } from "$lib/stores/session";
  import { partytownSnippet } from "@qwik.dev/partytown/integration";
  import { mode, ModeWatcher } from "mode-watcher";
  import { type Snippet } from "svelte";
  import { Toaster } from "svelte-sonner";
  import "../app.css";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  session.subscribe(($session) => {
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
        });
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

<ModeWatcher />

<div class="flex min-h-screen flex-col">
  <header>
    <Navbar />
  </header>

  <main class="mx-auto mt-1 mb-12 w-full max-w-4xl grow px-2 sm:px-3 md:px-5">
    {@render children?.()}
  </main>
</div>

<!-- NOTE: I struggled to get shad semantic classes working to style the toasts
 It's possible to apply them, but only when toastOptions.unstyled: true
 And then ALL other styles are removed...
 So, richColors for now -->
<Toaster
  richColors
  theme={mode.current}
  closeButton={true}
  duration={10_000}
>
  {#snippet loadingIcon()}
    <Icon
      icon="lucide/loader-2"
      class="size-5 animate-spin"
    />
  {/snippet}

  {#snippet successIcon()}
    <Icon
      icon="lucide/check"
      class="size-5"
    />
  {/snippet}

  {#snippet errorIcon()}
    <Icon
      icon="lucide/x"
      class="size-5"
    />
  {/snippet}

  {#snippet infoIcon()}
    <Icon
      icon="lucide/info"
      class="size-5"
    />
  {/snippet}

  {#snippet warningIcon()}
    <Icon
      icon="lucide/alert-triangle"
      class="size-5"
    />
  {/snippet}
</Toaster>
