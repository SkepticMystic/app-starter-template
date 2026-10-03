<script lang="ts">
  import FooterBlock from "#lib/components/blocks/footer/FooterBlock.svelte";
  import Navbar from "#lib/components/blocks/navbar/Navbar.svelte";
  import AppSidebar from "#lib/components/blocks/sidebar/AppSidebar.svelte";
  import SidebarProvider from "#lib/components/ui/sidebar/sidebar-provider.svelte";
  import { untrack } from "svelte";

  let { data, children } = $props();

  /**
   * Read once: after hydration the provider owns it, writing the cookie on every toggle. Not
   * `open={data.sidebar_open}` — the root's universal load re-runs per URL, so every navigation
   * hands this layout a new `data` carrying the value this load read last, and a one-way prop
   * would put that back over the provider's own write, re-opening a collapsed sidebar on every
   * click.
   */
  let sidebar_open = $state(untrack(() => data.sidebar_open));
</script>

<SidebarProvider bind:open={sidebar_open}>
  <AppSidebar />

  <div class="flex min-h-screen w-full flex-col">
    <header
      class="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md"
    >
      <Navbar />
    </header>

    <main
      class="
      mx-auto mt-3 mb-12 w-full max-w-7xl grow px-2
      sm:px-3
      md:px-5
    "
    >
      {@render children?.()}
    </main>

    <FooterBlock />
  </div>
</SidebarProvider>
