<script lang="ts">
  import AuditEventTable from "#lib/components/blocks/audit/AuditEventTable.svelte";
  import Header from "#lib/components/ui/header/Header.svelte";

  let { data } = $props();
</script>

<article>
  <Header
    title="Organization activity"
    description="Members joining, leaving and changing role, and API keys being created and deleted."
  />

  <AuditEventTable
    view="org"
    rows={data.events}
    total={data.total}
    offset={data.offset}
    limit={data.limit}
  />
</article>
