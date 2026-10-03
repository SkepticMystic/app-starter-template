import { db } from "#lib/server/db/drizzle.db.js";
import { result } from "#lib/utils/result.util.js";
import { Repo } from "./index.repo";

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

export const OrganizationRepo = {
  get_membership,
};
