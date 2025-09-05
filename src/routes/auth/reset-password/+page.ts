import { Parsers } from "$lib/schema/parsers";
import z from "zod";
import type { PageLoad } from "./$types";

export const load = (async ({ url }) => {
  const search = Parsers.url(
    url,
    z.object({
      token: z.string().optional(),
      // NOTE: iirc, BetterAuth sends an error in the query params on failure
      error: z.string().optional(),
    }),
  );

  return {
    search,
  };
}) satisfies PageLoad;
