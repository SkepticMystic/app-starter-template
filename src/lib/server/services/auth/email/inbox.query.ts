import { db } from "#lib/server/db/drizzle.db.js";
import type { UserTable } from "#lib/server/db/models/auth.model.js";
import type {
  Columns,
  Every,
  NonEmpty,
  Projected,
} from "#lib/server/db/projection.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { email_key_sql } from "#lib/server/db/sql.util.js";
import { eq } from "drizzle-orm";

/**
 * An account whose address reaches the same inbox as `email` — equal up to
 * case, a `+tag` or Gmail's dots — other than `except_user_id`, or `undefined`
 * if there is none. Answered from `user_email_key_idx`.
 */
const owner = <const C extends Columns<typeof UserTable>>(
  input: { email: string; except_user_id?: string },
  columns: NonEmpty<C>,
): Promise<App.Result<Projected<typeof UserTable, C> | undefined>> =>
  Repo.query(
    db.query.user.findFirst({
      // Widened, since drizzle cannot infer through a generic `columns`; the
      // declared return type narrows the row back to `C`.
      columns: columns as Every<typeof UserTable>,
      where: {
        id: input.except_user_id ? { ne: input.except_user_id } : undefined,
        RAW: (user) =>
          eq(email_key_sql(user.email), email_key_sql(input.email)),
      },
    }),
  );

export const InboxQuery = {
  owner,
};
