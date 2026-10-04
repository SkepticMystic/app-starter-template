import {
  list_sessions_remote,
  revoke_other_sessions_remote,
  revoke_session_remote,
} from "#lib/remote/auth/session.remote.js";
import { result } from "#lib/utils/result.util.js";
import { Client } from "../index.client.js";

export const SessionClient = {
  revoke: Client.wrap(
    (id: string) =>
      revoke_session_remote(id).updates(
        list_sessions_remote().withOverride((cur) =>
          result.pipe(cur, (d) => d.filter((s) => s.id !== id)),
        ),
      ),
    {
      confirm: "Sign out this session? That device will need to sign in again.",
      destructive: true,
      action_label: "Sign out",
      suc_msg: "Session signed out",
    },
  ),

  revoke_others: Client.wrap(
    () =>
      revoke_other_sessions_remote().updates(
        list_sessions_remote().withOverride((cur) =>
          result.pipe(cur, (d) => d.filter((s) => s.current)),
        ),
      ),
    {
      confirm:
        "Sign out everywhere else? Every other device will need to sign in again.",
      destructive: true,
      action_label: "Sign out others",
      suc_msg: "Signed out of every other session",
    },
  ),
};
