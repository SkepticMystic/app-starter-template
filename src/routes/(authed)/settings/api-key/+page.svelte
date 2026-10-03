<script lang="ts">
  import { resolve } from "$app/paths";
  import Header from "#lib/components/ui/header/Header.svelte";
  import {
    CellHelpers,
    column_helper,
  } from "#lib/utils/tanstack/table.util.js";
  import { APIKeyClient } from "#lib/clients/auth/apikey.client.js";
  import Button from "#lib/components/ui/button/button.svelte";
  import DataTable from "#lib/components/ui/data-table/data-table.svelte";
  import { Arrays } from "#lib/utils/array/array.util.js";

  let { data } = $props();

  let apikeys = $derived(data.apikeys);

  const column = column_helper<(typeof apikeys)[number]>();

  const columns = [
    column.accessor("name", {
      meta: { label: "Name" },

      // cell: ({getValue, row}) => renderComponent(Anchor, {
      //   href: resolve("/(authed)/settings/api-keys/[id]/edit", row),
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
  ];
</script>

<article>
  <Header title="API Keys">
    {#snippet actions()}
      <Button
        icon="lucide/plus"
        href={resolve("/(authed)/settings/api-key/create")}
      >
        Create API Key
      </Button>
    {/snippet}
  </Header>

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
