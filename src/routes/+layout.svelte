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
  import { TOAST, type IToast } from "$lib/const/toast.const";
  import { session } from "$lib/stores/session";
  import { onMount } from "svelte";
  import { toast, Toaster } from "svelte-daisyui-toast";
  import { themeChange } from "theme-change";
  import "../app.css";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();
  let loading = $state(true);

  onMount(async () => {
    themeChange(false);
  });

  $effect(() => {
    if ($session.isRefetching) {
      console.log("$session refetching...");
    } else if ($session.isPending) {
      console.log("$session pending...");
    } else {
      loading = false;
      console.log("$session loaded", $session.data);

      if (browser && window.umami && $session.data?.user) {
        window.umami.identify($session.data?.session.id, {
          name: $session.data.user.name,
          email: $session.data.user.email,
          user_id: $session.data?.session.userId,
          ip_address: $session.data?.session.ipAddress,
          user_agent: $session.data?.session.userAgent,
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
      toast.add(TOAST.MAP[toast_key]);
    }
  });
</script>

<!-- Sigh... can't get this to work in app.html
 Vite docs suggest I can interpolate public env vars using %PUBLIC_VARIABLE%, but it never works -->
<svelte:head>
  {#if PUBLIC_UMAMI_BASE_URL && PUBLIC_UMAMI_WEBSITE_ID}
    <script
      defer
      src="{PUBLIC_UMAMI_BASE_URL}/script.js"
      data-website-id={PUBLIC_UMAMI_WEBSITE_ID}
      data-do-not-track="true"
      data-tag={dev ? "dev" : "prod"}
    ></script>
  {/if}
</svelte:head>

<header>
  <Navbar />
</header>

<!-- TODO: Add responsive margins on mobile -->
<main class="mx-auto my-6 max-w-6xl px-3">
  <Loading {loading}>
    {@render children?.()}
  </Loading>
</main>

<Toaster />
