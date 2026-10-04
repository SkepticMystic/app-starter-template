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
  import { renderComponent } from "#lib/components/ui/data-table/index.js";
  import Code from "#lib/components/ui/elements/Code.svelte";
  import { Arrays } from "#lib/utils/array/array.util.js";
  import { can } from "#lib/utils/auth/permission.util.js";

  let { data } = $props();

  let apikeys = $derived(data.apikeys);

  const column = column_helper<(typeof apikeys)[number]>();

  const columns = [
    column.accessor("name", {
      meta: { label: "Name" },

      cell: CellHelpers.text,
    }),
    column.accessor("start", {
      meta: { label: "Key" },

      cell: ({ getValue }) =>
        renderComponent(Code, { content: `${getValue() ?? ""}…` }),
    }),
    column.accessor("enabled", {
      meta: { label: "Active" },

      cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
    }),
    column.accessor("createdAt", {
      meta: { label: "Created" },

      cell: CellHelpers.time,
    }),
    column.accessor("expiresAt", {
      meta: { label: "Expires" },

      cell: CellHelpers.time,
    }),

    column.accessor("lastRequest", {
      meta: { label: "Last request" },

      // "20 minutes ago" answers "is this key still in use?" better than a clock time.
      cell: (c) => CellHelpers.time(c, { show: "auto", fallback: "Never" }),
    }),
  ];
</script>

<article>
  <Header title="API keys">
    {#snippet actions()}
      {#if can({ apiKey: ["create"] })}
        <Button
          icon="lucide/plus"
          href={resolve("/(authed)/settings/api-key/create")}
        >
          Create API key
        </Button>
      {/if}
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
      actions={(row) =>
        can({ apiKey: ["delete"] })
          ? [
              {
                title: "Delete",
                icon: "lucide/trash",
                variant: "destructive",
                onselect: () =>
                  APIKeyClient.delete(
                    { keyId: row.id },
                    {
                      on_success: () =>
                        (apikeys = Arrays.remove(apikeys, row.id)),
                    },
                  ),
              },
            ]
          : []}
    />
  </section>
</article>
