import { command, form, query } from "$app/server";
import { get_session } from "$lib/server/services/auth.service";
import { PasskeyService } from "$lib/server/services/auth/passkey/passkey.service";
import { invalid } from "@sveltejs/kit";
import { z } from "zod";

export const list_passkeys_remote = query(async () => {
  const session = await get_session();
  if (!session.ok) return session;

  return await PasskeyService.list(session.data);
});

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
