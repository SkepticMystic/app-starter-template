import {
  guarded_command,
  guarded_form,
  ORG,
} from "#lib/server/remote/guarded.js";
import { APIKeyService } from "#lib/server/services/auth/apikey/apikey.service.js";
import { invalid } from "@sveltejs/kit";
import { z } from "zod";

export const create_apikey_remote = guarded_form(
  { ...ORG, session: { org_permissions: { apiKey: ["create"] } } },
  z.object({
    name: z
      .string()
      .trim()
      .min(1, "Please name the key")
      .max(100, "Name must be at most 100 characters"),
    expiresIn: z.union([
      z.coerce
        .number<string>()
        .min(1, "API key expiration must be at least 1 second"),
      z.literal("").transform(() => undefined),
    ]),
  }),
  async (input, { org_id }) => {
    const res = await APIKeyService.create(input, org_id);

    if (!res.ok && res.error.path) {
      invalid(res.error);
    }

    return res;
  },
);

export const delete_apikey_remote = guarded_command(
  { ...ORG, session: { org_permissions: { apiKey: ["delete"] } } },
  z.object({
    keyId: z.uuid(),
    configId: z.string().max(100).optional(),
  }),
  async (input) => APIKeyService.delete(input),
);
