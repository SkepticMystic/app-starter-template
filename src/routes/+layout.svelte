<script lang="ts">
  import { browser, dev } from "$app/environment";
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import {
      PUBLIC_UMAMI_BASE_URL,
      PUBLIC_UMAMI_WEBSITE_ID,
  } from "$env/static/public";
  import Loading from "$lib/components/ui/loading/Loading.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { TOAST, type IToast } from "$lib/const/toast.const";
  import { session } from "$lib/stores/session";
  import { partytownSnippet } from "@qwik.dev/partytown/integration";
  import { mode, ModeWatcher } from "mode-watcher";
  import { onMount, type Snippet } from "svelte";
  import { toast, Toaster } from "svelte-sonner";
  import "../app.css";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  let loading = $state(true);

  session.subscribe(($session) => {
    if ($session.isRefetching || $session.isPending) {
      return;
    } else {
      loading = false;
      console.log("$session loaded", $session.data);

      if (browser && umami && $session.data?.user) {
        umami.identify($session.data.user.id, {
          name: $session.data.user.name,
          email: $session.data.user.email,
          session_id: $session.data.session.id,
          ip_address: $session.data.session.ipAddress,
          user_agent: $session.data.session.userAgent,
        });
      }
    }
  });

  const handle_toast_flash_query = () => {
    const toast_id = page.url.searchParams.get("toast") as IToast.Id | null;

    if (toast_id) {
      // Remove the toast param from the URL after showing the toast
      // so it doesn't show again on page refresh
      page.url.searchParams.delete("toast");

      const toast_key = TOAST.IDS_REVERSED[toast_id];
      if (!toast_key) return;

      const input = TOAST.MAP[toast_key];
      toast[input.type](input.message);
    }
  };

  // NOTE: We have to check in both cases...
  // - If we `goto` a route with a ?toast, then afterNavigate is called
  // - If we visit from an external link - or `location.href =` - with a ?toast, then onMount is called
  onMount(() => handle_toast_flash_query());
  afterNavigate(() => handle_toast_flash_query());
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
      type="text/partytown"
      src="{PUBLIC_UMAMI_BASE_URL}/script.js"
      data-website-id={PUBLIC_UMAMI_WEBSITE_ID}
      data-tag={dev ? "dev" : "prod"}
      data-do-not-track="true"
    ></script>
  {/if}
</svelte:head>

<ModeWatcher />

<header>
  <Navbar />
</header>

<main class="mx-auto my-6 max-w-5xl px-2 sm:px-3 md:px-5">
  <Loading {loading}>
    {@render children?.()}
  </Loading>
</main>

<!-- NOTE: I struggled to get shad semantic classes working to style the toasts
 It's possible to apply them, but only when toastOptions.unstyled: true
 And then ALL other styles are removed... 
 So, richColors for now -->
<Toaster richColors theme={mode.current} closeButton={true} duration={10_000}>
  {#snippet loadingIcon()}
    <Icon icon="lucide/loader-2" size="size-5" class="animate-spin" />
  {/snippet}

  {#snippet successIcon()}
    <Icon icon="lucide/check" size="size-5" />
  {/snippet}

  {#snippet errorIcon()}
    <Icon icon="lucide/x" size="size-5" />
  {/snippet}

  {#snippet infoIcon()}
    <Icon icon="lucide/info" size="size-5" />
  {/snippet}

  {#snippet warningIcon()}
    <Icon icon="lucide/alert-triangle" size="size-5" />
  {/snippet}
</Toaster>
