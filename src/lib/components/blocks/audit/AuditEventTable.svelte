<script
  lang="ts"
  module
>
  import type { IAudit } from "#lib/const/auth/audit.const.js";

  type Person = { name: string; email: string };

  /** One row of the log as a view hands it over: only what that view may show. */
  export type AuditRow = {
    id: string;
    type: IAudit.EventId;
    metadata: IAudit.Metadata;
    createdAt: Date;
    device?: string | null;
    country?: string | null;
    ip?: string | null;
    /** Whose account it happened to; `null` for nobody's, or a deleted user's. */
    subject?: Person | null;
    /** Who did it; `null` for the subject themselves. */
    actor?: Person | null;
    /** For the user's own log, which names no one else: done by someone other than them. */
    by_other?: boolean;
  };
</script>

<script lang="ts">
  import DataTable from "#lib/components/ui/data-table/data-table.svelte";
  import { renderComponent } from "#lib/components/ui/data-table/index.js";
  import { AUDIT } from "#lib/const/auth/audit.const.js";
  import type { DataTableFilter } from "#lib/interfaces/tanstack/table.type.js";
  import {
    CellHelpers,
    column_helper,
  } from "#lib/utils/tanstack/table.util.js";
  import { Url } from "#lib/utils/urls.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import AuditEventCell from "./AuditEventCell.svelte";
  import AuditPersonCell from "./AuditPersonCell.svelte";

  let {
    rows,
    total,
    offset,
    limit,
    view,
  }: {
    rows: AuditRow[];
    total: number;
    offset: number;
    limit: number;
    /**
     * Whose log this is, which decides its columns: a user's own shows where
     * each event came from; an org's and the admin's show who it involved.
     */
    view: "user" | "org" | "admin";
  } = $props();

  // A mutable copy: `page.url.searchParams` is read-only in kit 3.
  const params = $derived(new URLSearchParams(page.url.search));

  const column = column_helper<AuditRow>();

  // Fixed per page: `view` never changes on one.
  const columns = [
    column.accessor("type", {
      meta: { label: "Event" },

      cell: ({ row }) =>
        renderComponent(AuditEventCell, {
          type: row.original.type,
          metadata: row.original.metadata,
        }),
    }),

    ...(view === "user"
      ? []
      : [
          column.display({
            id: "subject",
            meta: { label: "Account" },

            cell: ({ row }) =>
              renderComponent(AuditPersonCell, {
                person: row.original.subject,
                fallback: row.original.metadata.removed_user_id
                  ? "Deleted user"
                  : "—",
              }),
          }),
        ]),

    column.display({
      id: "actor",
      meta: { label: "By" },

      cell: ({ row }) => {
        if (view === "user") {
          if (!row.original.by_other) return "You";

          return row.original.metadata.impersonated
            ? "An admin, as you"
            : "Someone else";
        }

        return renderComponent(AuditPersonCell, {
          person: row.original.actor,
          fallback: row.original.subject ? "Themselves" : "—",
        });
      },
    }),

    ...(view === "org"
      ? []
      : [
          column.accessor("device", {
            meta: { label: "Device" },

            cell: CellHelpers.text,
          }),
          column.accessor("country", {
            meta: { label: "Location" },

            cell: CellHelpers.text,
          }),
          column.accessor("ip", {
            meta: { label: "IP address" },

            cell: CellHelpers.text,
          }),
        ]),

    column.accessor("createdAt", {
      meta: { label: "When" },

      cell: (c) => CellHelpers.time(c, { show: "datetime" }),
    }),
  ];

  const filters: DataTableFilter[] = [
    {
      kind: "multi",
      id: "type",
      placeholder: "Event",
      options: view === "org" ? AUDIT.EVENTS.ORG_OPTIONS : AUDIT.EVENTS.OPTIONS,
    },
    {
      kind: "date_range",
      id: "created",
      placeholder: "Date",
    },
    ...(view === "admin"
      ? [
          {
            kind: "search" as const,
            id: "email",
            placeholder: "Account email",
          },
        ]
      : []),
  ];
</script>

<DataTable
  {columns}
  noun="event"
  data={rows}
  server={{
    total,
    offset,
    limit,
    params,
    on_change: (patch) =>
      goto(Url.set_params(params, patch), {
        // Keep the focused search box and the scroll position.
        reset: false,
      }),
  }}
  {filters}
  empty={({ filtering }) =>
    filtering
      ? {
          icon: "lucide/shield",
          title: "No matching events",
          description: "Try a different event or date range.",
        }
      : {
          icon: "lucide/shield",
          title: "No security activity yet",
          description:
            "Sign-ins and changes to sign-in settings will appear here.",
        }}
></DataTable>
