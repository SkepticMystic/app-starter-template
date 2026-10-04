import { db } from "#lib/server/db/drizzle.db.js";
import { APIKeyTable } from "#lib/server/db/models/auth.model.js";
import { eq } from "drizzle-orm";
import { Repo } from "./index.repo.js";

/**
 * System-triggered writes across every key an org holds, which Better-Auth's
 * plugin API cannot express (its endpoints act on one key, as a member).
 *
 * Safe beneath the plugin: `verifyApiKey` ends in `claimUsageInDatabase`, which
 * updates the row by id and answers `INVALID_API_KEY` when there is none, so a
 * copy cached in Redis is refused on its next use rather than trusted. That
 * holds only while `deferUpdates` is off in `src/lib/auth.ts`.
 */

/**
 * Deletes every key an org holds, on its deletion — `referenceId` has no
 * foreign key, so nothing else removes them. Zero rows is ordinary.
 */
const delete_by_reference = async (input: {
  org_id: string;
}): Promise<App.Result<{ row_count: number }>> =>
  Repo.delete(
    db.delete(APIKeyTable).where(eq(APIKeyTable.referenceId, input.org_id)),
  );

export const APIKeyRepo = {
  delete_by_reference,
};
