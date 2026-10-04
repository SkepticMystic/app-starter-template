import { db } from "#lib/server/db/drizzle.db.js";
import {
  OrganizationTable,
  UserTable,
} from "#lib/server/db/models/auth.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { raise } from "#lib/utils/result.util.js";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
  const session = await get_session({ admin: true });
  if (!session.ok) {
    raise(session.error);
  }

  const [users, organizations] = await Promise.all([
    Repo.count(db.$count(UserTable)),
    Repo.count(db.$count(OrganizationTable)),
  ]);
  if (!users.ok) raise(users.error);
  if (!organizations.ok) raise(organizations.error);

  return { counts: { users: users.data, organizations: organizations.data } };
}) satisfies PageServerLoad;
