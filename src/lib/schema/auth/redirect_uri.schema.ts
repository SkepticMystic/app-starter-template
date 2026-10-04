import { safe_redirect_uri } from "#lib/utils/auth/redirect_uri.util.js";
import { z } from "zod";

/** {@link safe_redirect_uri} for a remote's input. Client code calls that directly. */
export const redirect_uri_schema = (fallback = "/onboarding") =>
  z
    .string()
    .default(fallback)
    .transform((value) => safe_redirect_uri(value, fallback));
