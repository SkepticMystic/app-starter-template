import {
  guarded_command,
  guarded_query,
  USER,
} from "#lib/server/remote/guarded.js";
import { UserSessionService } from "#lib/server/services/auth/user/user_session.service.js";
import { z } from "zod";

export const list_sessions_remote = guarded_query(USER, async ({ session }) =>
  UserSessionService.list(session),
);

export const revoke_session_remote = guarded_command(
  USER,
  z.string().regex(/^[0-9a-f]{32}$/),
  async (id, { session }) => UserSessionService.revoke(id, session),
);

export const revoke_other_sessions_remote = guarded_command(USER, async () =>
  UserSessionService.revoke_others(),
);
