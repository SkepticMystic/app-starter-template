<script lang="ts">
  import { OrganizationClient } from "#lib/clients/auth/organization.client.js";
  import DataTable from "#lib/components/ui/data-table/data-table.svelte";
  import { ORGANIZATION } from "#lib/const/auth/organization.const.js";
  import type { Invitation } from "#lib/server/db/models/auth.model.js";
  import { can } from "#lib/utils/auth/permission.util.js";
  import {
    CellHelpers,
    column_helper,
  } from "#lib/utils/tanstack/table.util.js";

  let {
    invitations,
    on_cancel,
    on_resend,
  }: {
    invitations: Pick<
      Invitation,
      "id" | "email" | "role" | "status" | "expiresAt"
    >[];
    on_cancel?: (invitation_id: string) => void;
    on_resend?: (
      invitation_id: string,
      sent: Pick<Invitation, "id" | "email" | "role" | "status" | "expiresAt">,
    ) => void;
  } = $props();

  const column = column_helper<NonNullable<typeof invitations>[number]>();

  const columns = [
    column.accessor("email", {
      meta: { label: "Email" },
    }),
    column.accessor("role", {
      meta: { label: "Role" },

      cell: (c) => CellHelpers.label(c, ORGANIZATION.ROLES.MAP),
    }),

    column.accessor("status", {
      meta: { label: "Status" },

      filterFn: "arrHas",

      // Better-Auth never moves an expired invite out of `pending`, so the
      // stored status (which the filter reads) would show it as live.
      cell: (c) =>
        c.row.original.status === "pending" &&
        c.row.original.expiresAt < new Date()
          ? "Expired"
          : CellHelpers.label(c, ORGANIZATION.INVITATIONS.STATUSES.MAP),
    }),

    column.accessor("expiresAt", {
      meta: { label: "Expiry date" },

      cell: (c) => CellHelpers.time(c, { show: "datetime" }),
    }),
  ];
</script>

<DataTable
  {columns}
  data={invitations}
  states={{
    sorting: [{ id: "expiresAt", desc: true }],
    column_filters: [{ id: "status", value: ["pending"] }],
  }}
  noun="invitation"
  filters={[
    {
      kind: "multi",
      id: "status",
      label: "Statuses",
      options: ORGANIZATION.INVITATIONS.STATUSES.OPTIONS,
    },
  ]}
  empty={({ filtering }) =>
    filtering
      ? {
          icon: "lucide/filter",
          title: "No matching invitations",
          description: "No invitation has one of the statuses you picked.",
        }
      : {
          icon: "lucide/mail",
          title: "No invitations",
          description: "Invite a new member to your organization",
        }}
  actions={(row) => [
    {
      icon: "lucide/send",
      title: "Resend invitation",
      hide: !can({ invitation: ["create"] }),
      disabled: row.original.status !== "pending",

      onselect: () =>
        OrganizationClient.invitation.resend(row.id, {
          on_success: (sent) => on_resend?.(row.id, sent),
        }),
    },
    {
      icon: "lucide/x",
      variant: "destructive",
      title: "Cancel invitation",
      hide: !can({ invitation: ["cancel"] }),
      disabled: row.original.status !== "pending",

      onselect: () =>
        OrganizationClient.invitation.cancel(row.id, {
          on_success: () => on_cancel?.(row.id),
        }),
    },
  ]}
></DataTable>
