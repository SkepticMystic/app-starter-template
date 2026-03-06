<script lang="ts">
  import { resolve } from "$app/paths";
  import { APIKeyClient } from "$lib/clients/auth/apikey.client.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import DataTable from "$lib/components/ui/data-table/data-table.svelte";
  import { Arrays } from "$lib/utils/array/array.util.js";
  import { CellHelpers } from "$lib/utils/tanstack/table.util.js";
  import { createColumnHelper } from "@tanstack/table-core";

  let { data } = $props();

  let apikeys = $derived(data.apikeys);

  const column = createColumnHelper<(typeof apikeys)[number]>();

  const columns = [
    column.accessor("name", {
      meta: { label: "Name" },

      // cell: ({getValue, row}) => renderComponent(Anchor, {
      //   href: resolve("/(authed)/account/api-keys/[id]/edit", row),
      //   content: getValue(),
      // })
    }),
    column.accessor("start", {
      meta: { label: "" },

      cell: ({ getValue }) => getValue() + "********",
    }),
    column.accessor("enabled", {
      meta: { label: "Active" },

      cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
    }),
    column.accessor("createdAt", {
      meta: { label: "Created At" },

      cell: CellHelpers.time,
    }),
    column.accessor("expiresAt", {
      meta: { label: "Expires At" },

      cell: CellHelpers.time,
    }),

    column.accessor("lastRequest", {
      meta: { label: "Last Request" },

      cell: CellHelpers.time,
    }),
    column.accessor("requestCount", {
      meta: { label: "Request Count" },

      cell: CellHelpers.number,
    }),
  ];
</script>

<article>
  <header class="flex items-center justify-between gap-3">
    <h1>API Keys</h1>

    <Button
      icon="lucide/plus"
      href={resolve("/(authed)/account/api-key/create")}
    >
      Create API Key
    </Button>
  </header>

  <section>
    <DataTable
      {columns}
      data={apikeys}
      empty={{
        icon: "lucide/key",
        title: "No API keys",
        description: "Create an API key to use with your applications.",
      }}
      actions={(row) => [
        {
          title: "Delete",
          icon: "lucide/trash",
          variant: "destructive",
          onselect: () =>
            APIKeyClient.delete(
              { keyId: row.id },
              { on_success: () => (apikeys = Arrays.remove(apikeys, row.id)) },
            ),
        },
      ]}
    />
  </section>
</article>
