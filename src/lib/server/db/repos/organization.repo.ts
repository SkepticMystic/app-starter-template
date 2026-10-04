import { db } from "#lib/server/db/drizzle.db.js";
import { OrganizationTable } from "#lib/server/db/models/auth.model.js";
import { result } from "#lib/utils/result.util.js";
import { eq } from "drizzle-orm";
import { Repo } from "./index.repo.js";

/**
 * The user's membership of an org as it is now, or `undefined` if there is
 * none. Read on every session check, so it selects only what the session
 * derives from it.
 */
const get_membership = async (input: {
  org_id: string;
  user_id: string;
}): Promise<App.Result<{ member_id: string; role: string } | undefined>> => {
  const res = await Repo.query(
    db.query.member.findFirst({
      columns: { id: true, role: true },
      where: { organizationId: input.org_id, userId: input.user_id },
    }),
  );
  if (!res.ok) return res;

  return result.suc(
    res.data && { member_id: res.data.id, role: res.data.role },
  );
};

/**
 * The user behind every membership of an org. Read *before* the org is
 * deleted: `member` cascades with it, and its users' sessions outlive the row.
 * @see OrganizationService.revoke_access
 */
const list_member_user_ids = async (input: {
  id: string;
}): Promise<App.Result<string[]>> => {
  const res = await Repo.query(
    db.query.member.findMany({
      columns: { userId: true },
      where: { organizationId: input.id },
    }),
  );
  if (!res.ok) return res;

  return result.suc(res.data.map((m) => m.userId));
};

/**
 * Deletes the org row. `member` and `invitation` cascade; sessions and API keys
 * do not, which is why the service never calls this alone.
 */
const delete_by_id = async (input: { id: string }): Promise<App.Result<void>> =>
  Repo.delete_one(
    db.delete(OrganizationTable).where(eq(OrganizationTable.id, input.id)),
  );

export const OrganizationRepo = {
  get_membership,
  list_member_user_ids,
  delete_by_id,
};
