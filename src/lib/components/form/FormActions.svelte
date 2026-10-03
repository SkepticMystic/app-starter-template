<script lang="ts">
  import Button from "#lib/components/ui/button/button.svelte";
  import type { Snippet } from "svelte";

  let {
    cancel_href,
    children,
  }: {
    /** Where Cancel goes — the list, or the record being edited. No Cancel without one. */
    cancel_href?: string;
    /** The submit button. */
    children: Snippet;
  } = $props();
</script>

<!-- A form's last row, right-aligned like a dialog's footer: the way out, then the way through. -->
<div class="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
  {#if cancel_href}
    <Button
      variant="ghost"
      href={cancel_href}
    >
      Cancel
    </Button>
  {/if}

  {@render children()}
</div>
