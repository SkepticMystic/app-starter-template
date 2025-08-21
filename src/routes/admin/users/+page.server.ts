import { get_session } from "$lib/auth/server";
import { Users } from "$lib/models/auth/User.model";
import type { PageServerLoad } from "./$types";

export const load = (async ({ request }) => {
  const [_admin, users] = await Promise.all([
    get_session(request, { admin: true }),
    Users.find().lean(),
  ]);

  return { users };
}) satisfies PageServerLoad;
