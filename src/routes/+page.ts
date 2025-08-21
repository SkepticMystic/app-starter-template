import { Parsers } from "$lib/schema/parsers";
import { z } from "zod";
import type { PageLoad } from "./$types";

export const load = (async ({ url }) => {
  const search = Parsers.url(url, z.object({ toast: z.string() }).partial());

  return {
    search,
  };
}) satisfies PageLoad;
