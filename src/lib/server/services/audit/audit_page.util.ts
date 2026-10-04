import { AUDIT } from "#lib/const/auth/audit.const.js";
import { TIME } from "#lib/const/time.const.js";
import type { AuditEventTable } from "#lib/server/db/models/audit.model.js";
import { parseDate } from "@internationalized/date";
import type { TableFilter } from "drizzle-orm";
import { z } from "zod";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * The params `AuditEventTable.svelte` writes, the same for every view of the
 * log. Each `.catch`es to its default, so a hand-edited URL renders the
 * unfiltered first page rather than an error.
 */
const params_schema = z.object({
  type: z.array(z.enum(AUDIT.EVENTS.IDS)).catch([]),
  // `YYYY-MM-DD`, both ends inclusive; a half or malformed range is ignored.
  created_from: z.iso.date().nullable().catch(null),
  created_to: z.iso.date().nullable().catch(null),
  /** The admin view's search by account address. */
  email: z.string().trim().max(255).catch(""),
  offset: z.coerce.number().int().min(0).catch(0),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .catch(DEFAULT_LIMIT)
    .transform((limit) => Math.min(limit, MAX_LIMIT)),
});

type AuditPageParams = z.output<typeof params_schema>;

const params = (url: URL): AuditPageParams =>
  params_schema.parse({
    type: url.searchParams.getAll("type"),
    created_from: url.searchParams.get("created_from"),
    created_to: url.searchParams.get("created_to"),
    email: url.searchParams.get("email") ?? "",
    offset: url.searchParams.get("offset") ?? 0,
    limit: url.searchParams.get("limit") ?? DEFAULT_LIMIT,
  });

/**
 * The filter the params ask for. A view adds its own scope (`user_id`,
 * `org_id`) on top, after this, so a param can never widen it.
 */
const where = (p: AuditPageParams): TableFilter<typeof AuditEventTable> => {
  // Calendar days in the app's zone, up to the start of the day after `to`.
  const created =
    p.created_from && p.created_to
      ? {
          gte: parseDate(p.created_from).toDate(TIME.ZONE),
          lt: parseDate(p.created_to).add({ days: 1 }).toDate(TIME.ZONE),
        }
      : undefined;

  return {
    type: p.type.length ? { in: p.type } : undefined,
    createdAt: created,
  };
};

export const AuditPage = { params, where };
