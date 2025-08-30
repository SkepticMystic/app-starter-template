<script lang="ts">
  import { browser, dev } from "$app/environment";
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import {
      PUBLIC_UMAMI_BASE_URL,
      PUBLIC_UMAMI_WEBSITE_ID,
  } from "$env/static/public";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Navbar from "$lib/components/daisyui/Navbar.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import SEO from "$lib/components/SEO.svelte";
  import { TOAST, type IToast } from "$lib/const/toast.const";
  import { session } from "$lib/stores/session";
  import { partytownSnippet } from "@qwik.dev/partytown/integration";
  import { mode, ModeWatcher } from "mode-watcher";
  import { type Snippet } from "svelte";
  import { toast, Toaster } from "svelte-sonner";
  import "../app.css";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  let loading = $state(true);

  $effect(() => {
    if ($session.isRefetching) {
      console.log("$session refetching...");
    } else if ($session.isPending) {
      console.log("$session pending...");
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

  afterNavigate(() => {
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
  });
</script>

<svelte:head>
  <script>
    partytown = {
      forward: ["umami.identify"],
    }
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

<main class="mx-auto my-6 max-w-6xl px-2 sm:px-3 md:px-5">
  <Loading {loading}>
    {@render children?.()}
  </Loading>
</main>

<Toaster 
  theme={mode.current}
  closeButton={true}
  duration={10_000}
>
  {#snippet loadingIcon()}
		<Icon icon='lucide/loader-2' class="animate-spin" />  
	{/snippet}

	{#snippet successIcon()}
		<Icon icon='lucide/check' />
	{/snippet}

	{#snippet errorIcon()}
    <Icon icon='lucide/x' />
	{/snippet}

	{#snippet infoIcon()}
    <Icon icon='lucide/info' />
	{/snippet}

	{#snippet warningIcon()}
    <Icon icon='lucide/alert-triangle' />
	{/snippet}
</Toaster>
