<script lang="ts">
  import FooterBlock from "$lib/components/blocks/footer/FooterBlock.svelte";
  import Navbar from "$lib/components/blocks/navbar/Navbar.svelte";
  import AppSidebar from "$lib/components/blocks/sidebar/AppSidebar.svelte";
  import SidebarProvider from "$lib/components/ui/sidebar/sidebar-provider.svelte";

  let { children } = $props();
</script>

<SidebarProvider>
  <AppSidebar />

  <div class="flex min-h-screen w-full flex-col">
    <header>
      <Navbar />
    </header>

    <main class="mx-auto mt-1 mb-12 w-full max-w-4xl grow px-2 sm:px-3 md:px-5">
      {@render children?.()}
    </main>

    <FooterBlock />
  </div>
</SidebarProvider>
