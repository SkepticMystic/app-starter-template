<script lang="ts">
  import { resolve } from "$app/paths";
  import ErrorPanel from "#lib/components/blocks/error/ErrorPanel.svelte";
</script>

<!-- Rendered inside `(authed)/+layout.svelte`, so a failed page load keeps the sidebar and the
  way out is one click. A failure in that layout's own load goes to the root `+error.svelte`
  instead. -->
<article>
  <ErrorPanel
    home={resolve("home")}
    class="mx-auto mt-10 max-w-lg"
  />
</article>
