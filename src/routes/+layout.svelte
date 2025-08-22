<script lang="ts">
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Navbar from "$lib/components/daisyui/Navbar.svelte";
  import axios from "axios";
  import { onMount } from "svelte";
  import { toast, Toaster } from "svelte-daisyui-toast";
  import "../app.css";

  interface Props {
    children?: import("svelte").Snippet;
  }

  let { children }: Props = $props();

  toast.defaults.set({ clear_on_navigate: true, duration_ms: 10_000 });

  let loading = $state(true);
  onMount(async () => {
    // const res = await axios.get<{}>("/api/init");

    loading = false;
  });
</script>

<header>
  <Navbar />
</header>

<main class="mx-14 my-4">
  <Loading {loading}>
    {@render children?.()}
  </Loading>
</main>

<Toaster />
