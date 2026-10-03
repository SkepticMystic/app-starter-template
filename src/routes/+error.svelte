<script lang="ts">
  import { resolve } from "$app/paths";
  import ErrorPanel from "#lib/components/blocks/error/ErrorPanel.svelte";
  import Logo from "#lib/components/ui/image/Logo.svelte";
  import { page } from "$app/state";

  /** `/home` sends a session wherever it lands; the marketing page is the only home without one. */
  const home = $derived(page.data.user ? resolve("home") : resolve(""));
</script>

<!-- Outside both shells, so it brings its own mark. `(authed)/+error.svelte` handles a signed-in
  page's failure inside the app's chrome; this is for the rest. -->
<div
  class="
    flex min-h-svh flex-col items-center justify-center gap-8 px-4 py-12
  "
>
  <a
    href={home}
    class="rounded-md text-lg"
  >
    <Logo
      size="size-8"
      show_name
    />
  </a>

  <ErrorPanel
    {home}
    class="w-full max-w-md"
  />
</div>
