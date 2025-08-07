import { Parsers } from "$lib/schema/parsers";
import { z } from "zod";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ url }) => {
  const search = Parsers.url(
    url,
    z
      .object({
        team_token: z.string(),
        email_hint: z.email(),
      })
      .partial(),
  );

  return {
    search,
  };
};
