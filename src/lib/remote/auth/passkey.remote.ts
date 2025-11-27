import { command, form, getRequestEvent, query } from "$app/server";
import { auth, BA_ERROR_CODES } from "$lib/auth";
import { get_session } from "$lib/auth/server";
import { db } from "$lib/server/db/drizzle.db";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { error } from "@sveltejs/kit";
import { APIError } from "better-auth";
import z from "zod";

export const get_all_passkeys_remote = query(async () => {
  const session = await get_session();

  try {
    const passkeys = await db.query.passkey.findMany({
      where: (passkey, { eq }) => eq(passkey.userId, session.user.id),

      orderBy: (passkey, { desc }) => [desc(passkey.createdAt)],

      columns: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return result.suc(passkeys);
  } catch (error) {
    Log.error(error, "get_all_passkeys_remote.error");

    captureException(error);

    return result.err({ message: "Failed to get all passkeys" });
  }
});

export const get_passkey_by_id_remote = query.batch(
  z.uuid(), //
  async (passkey_ids) => {
    const session = await get_session();

    try {
      const passkeys = await db.query.passkey.findMany({
        where: (passkey, { and, eq, inArray }) =>
          and(
            eq(passkey.userId, session.user.id), //
            inArray(passkey.id, passkey_ids),
          ),

        orderBy: (passkey, { desc }) => [desc(passkey.createdAt)],

        columns: {
          id: true,
          name: true,
          createdAt: true,
        },
      });

      const map = new Map(passkeys.map((p) => [p.id, p]));

      return (passkey_id) => map.get(passkey_id);
    } catch (e) {
      Log.error(e, "get_passkey_by_id_remote.error");

      captureException(e);

      error(500, "Failed to get passkey by id");
    }
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

        if (error.body?.code === BA_ERROR_CODES.FAILED_TO_UPDATE_PASSKEY) {
          return result.err({ message: error.message });
        }

        return result.err({ message: error.message });
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
        return result.err({ message: error.message });
      } else {
        Log.error(error, "delete_passkey_remote.error unknown");

        captureException(error);

        return result.err({ message: "Internal server error" });
      }
    }
  },
);
