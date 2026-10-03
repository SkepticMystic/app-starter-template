import { command, form } from "$app/server";
import { guarded_query, USER } from "#lib/server/remote/guarded.js";
import { PasskeyService } from "#lib/server/services/auth/passkey/passkey.service.js";
import { invalid } from "@sveltejs/kit";
import { z } from "zod";

export const list_passkeys_remote = guarded_query(USER, async ({ session }) =>
  PasskeyService.list(session),
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
    const res = await PasskeyService.rename(input);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const delete_passkey_remote = command(
  z.uuid(),
  async (passkey_id): Promise<App.Result<undefined>> => {
    return await PasskeyService.remove(passkey_id);
  },
);
