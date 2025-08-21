import { auth } from "$lib/auth";
import { get_session } from "$lib/auth/server";
import { Parsers } from "$lib/schema/parsers";
import z from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request, url }) => {
  const search = Parsers.url(
    url,
    z.object({ invite_id: z.string().min(1, "Invite ID is required") }),
  );

  const [_user, invitation] = await Promise.all([
    get_session(request),

    auth.api.getInvitation({
      headers: request.headers,
      query: { id: search.invite_id },
    }),
  ]);

  return { invitation };
};
