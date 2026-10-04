<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import ErrorPanel from "#lib/components/blocks/error/ErrorPanel.svelte";
  import { error_copy } from "#lib/components/ui/error-state/ErrorState.svelte";
  import Page from "#lib/components/ui/layout/Page.svelte";
  import { APP } from "#lib/const/app.const.js";

  const copy = $derived(error_copy(page.status, page.error?.message));
</script>

<!-- `SEO` leaves signed-in titles to the page, and there is no `Header` here to name the tab. -->
<svelte:head>
  <title>{copy.title} · {APP.NAME}</title>
</svelte:head>

<!-- Rendered inside `(authed)/+layout.svelte`, so a failed page load keeps the sidebar and the
  way out is one click. A failure in that layout's own load goes to the root `+error.svelte`
  instead. -->
<Page>
  <ErrorPanel
    home={resolve("home")}
    class="mx-auto mt-10 max-w-lg"
  />
</Page>
