import { Parsers } from "$lib/schema/parsers";
import z from "zod";
import type { PageLoad } from "./$types";

export const load = (async ({ url }) => {
  const search = Parsers.url(
    url,
    z.object({ token: z.string().optional(), error: z.string().optional() }),
  );

  return {
    search,
  };
}) satisfies PageLoad;
