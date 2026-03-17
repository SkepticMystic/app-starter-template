import type { Branded } from "$lib/interfaces/zod/zod.type";
import Purify from "isomorphic-dompurify";

export const HTMLUtil = {
  sanitize: (dirty: string) => Purify.sanitize(dirty) as Branded<"SanitizedHTML">,
};
