<script lang="ts">
  import { resolve } from "$app/paths";
  import AuditEventTable from "#lib/components/blocks/audit/AuditEventTable.svelte";
  import Header from "#lib/components/ui/header/Header.svelte";
  import Page from "#lib/components/ui/layout/Page.svelte";

  let { data } = $props();
</script>

<Page>
  <Header
    title="Security log"
    back={{ href: resolve("/(authed)/admin"), label: "Admin" }}
  />

  <AuditEventTable
    view="admin"
    rows={data.events}
    total={data.total}
    offset={data.offset}
    limit={data.limit}
  />
</Page>
