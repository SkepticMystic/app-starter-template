<script lang="ts">
  import StatusBadge from "#lib/components/ui/badge/StatusBadge.svelte";
  import { AUDIT, type IAudit } from "#lib/const/auth/audit.const.js";

  let {
    type,
    metadata,
  }: {
    type: IAudit.EventId;
    metadata: IAudit.Metadata;
  } = $props();

  // A row written by an event the catalogue has since dropped still renders.
  const status = $derived(
    Object.hasOwn(AUDIT.EVENTS.MAP, type) ? AUDIT.EVENTS.MAP[type] : null,
  );
  const detail = $derived(status ? AUDIT.describe(type, metadata) : null);
</script>

<div class="flex flex-col items-start gap-1">
  {#if status}
    <StatusBadge {status} />
  {:else}
    <span>{type}</span>
  {/if}

  {#if detail}
    <span class="text-xs text-muted-foreground">{detail}</span>
  {/if}
</div>
