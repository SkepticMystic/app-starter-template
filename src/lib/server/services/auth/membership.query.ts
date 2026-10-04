import { db } from "#lib/server/db/drizzle.db.js";
import type { MemberTable } from "#lib/server/db/models/auth.model.js";
import type {
  Columns,
  Every,
  NonEmpty,
  Projected,
} from "#lib/server/db/projection.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";

/**
 * A user's membership of one org as it is now, or `undefined` if there is
 * none. Read on every session check, so callers name only what they use.
 */
const for_user = <const C extends Columns<typeof MemberTable>>(
  input: { org_id: string; user_id: string },
  columns: NonEmpty<C>,
): Promise<App.Result<Projected<typeof MemberTable, C> | undefined>> =>
  Repo.query(
    db.query.member.findFirst({
      // Widened, since drizzle cannot infer through a generic `columns`; the
      // declared return type narrows the row back to `C`.
      columns: columns as Every<typeof MemberTable>,
      where: { organizationId: input.org_id, userId: input.user_id },
    }),
  );

export const MembershipQuery = {
  for_user,
};
