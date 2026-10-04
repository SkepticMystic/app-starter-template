<script lang="ts">
  import AuditEventTable from "#lib/components/blocks/audit/AuditEventTable.svelte";
  import Header from "#lib/components/ui/header/Header.svelte";

  let { data } = $props();
</script>

<article>
  <Header
    title="Security activity"
    description="Sign-ins and changes to how your account signs in. If you don't recognise something, change your password."
  />

  <AuditEventTable
    view="user"
    rows={data.events}
    total={data.total}
    offset={data.offset}
    limit={data.limit}
  />
</article>
