import { command, form } from "$app/server";
import { get_session } from "$lib/server/services/auth.service";
import { APIKeyService } from "$lib/server/services/auth/apikey/apikey.service";
import { invalid } from "@sveltejs/kit";
import z from "zod";

export const create_apikey_remote = form(
  z.object({
    name: z.string().optional(),
    expiresIn: z.union([
      z.coerce
        .number<string>()
        .min(1, "API key expiration must be at least 1 second"),
      z.literal("").transform(() => undefined),
    ]),
  }),
  async (input) => {
    const session = await get_session();
    if (!session.ok) return session;

    const res = await APIKeyService.create(input, session.data);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

// export const update_api_key_remote = form(
//   z.object({
//     api_key_id: z.uuid(),
//     name: z
//       .string()
//       .min(1, "API key name must be at least 1 character")
//       .optional(),
//     expiresIn: z
//       .number()
//       .min(1, "API key expiration must be at least 1 second")
//       .optional(),
//   }),
//   async (input) => {
//     const session = await get_session();
//     if (!session.ok) return session;

//     const res = await APIKeyService.update(
//       input.api_key_id,
//       input,
//       session.data,
//     );

//     if (!res.ok && res.error.path) {
//       invalid(res.error);
//     }

//     return res;
//   },
// );

export const delete_apikey_remote = command(
  z.object({
    keyId: z.uuid(),
    configId: z.string().optional(),
  }),
  async (input) => {
    const session = await get_session();
    if (!session.ok) return session;

    const res = await APIKeyService.delete(input, session.data);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);
