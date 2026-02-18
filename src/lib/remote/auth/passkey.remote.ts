import { command, form, getRequestEvent, query } from "$app/server";
import { auth, is_ba_error_code } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { safe_get_session } from "$lib/server/services/auth.service";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { error } from "@sveltejs/kit";
import { APIError } from "better-auth";
import z from "zod";

export const list_passkeys_remote = query(async () => {
  const session = await safe_get_session();
  if (!session) return [];

  const passkeys = await Repo.query(
    db.query.passkey.findMany({
      where: { userId: session.user.id },

      orderBy: { createdAt: "desc" },

      columns: {
        id: true,
        name: true,
        createdAt: true,
      },
    }),
  );

  return passkeys;
});

export const get_passkey_by_id_remote = query.batch(
  z.uuid(), //
  async (passkey_ids) => {
    const session = await safe_get_session();
    if (!session) return () => undefined;

    const passkeys = await Repo.query(
      db.query.passkey.findMany({
        where: {
          userId: session.user.id,
          id: { in: passkey_ids },
        },

        orderBy: { createdAt: "desc" },

        columns: {
          id: true,
          name: true,
          createdAt: true,
        },
      }),
    );

    if (!passkeys.ok) {
      error(passkeys.error.status ?? 500, passkeys.error.message);
    }

    const map = new Map(passkeys.data.map((p) => [p.id, p]));

    return (passkey_id) => map.get(passkey_id);
  },
);

export const rename_passkey_remote = form(
  z.object({
    id: z.uuid(),
    name: z
      .string()
      .min(1, "Passkey name cannot be empty")
      .max(100, "Passkey name must be at most 100 characters"),
  }),
  async (input) => {
    try {
      const res = await auth.api.updatePasskey({
        body: { id: input.id, name: input.name },
        headers: getRequestEvent().request.headers,
      });

      get_passkey_by_id_remote(res.passkey.id).set({
        id: res.passkey.id,
        name: res.passkey.name ?? null,
        createdAt: res.passkey.createdAt,
      });

      return result.suc({ passkey: res.passkey });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "rename_passkey_remote.error better-auth");

        if (is_ba_error_code(error, "FAILED_TO_UPDATE_PASSKEY")) {
          return result.from_ba_error(error);
        } else {
          captureException(error);

          return result.from_ba_error(error);
        }
      } else {
        Log.error(error, "update_passkey_remote.error unknown");

        captureException(error);

        return result.err({ message: "Internal server error" });
      }
    }
  },
);

export const delete_passkey_remote = command(
  z.uuid(),
  async (passkey_id): Promise<App.Result<undefined>> => {
    try {
      await auth.api.deletePasskey({
        body: { id: passkey_id },
        headers: getRequestEvent().request.headers,
      });

      get_passkey_by_id_remote(passkey_id).set(undefined);

      return result.suc();
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "delete_passkey_remote.error better-auth");

        captureException(error);

        return result.from_ba_error(error);
      } else {
        Log.error(error, "delete_passkey_remote.error unknown");

        captureException(error);

        return result.err(ERROR.INTERNAL_SERVER_ERROR);
      }
    }
  },
);
