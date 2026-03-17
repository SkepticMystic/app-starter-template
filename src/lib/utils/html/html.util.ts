import type { Branded } from "$lib/interfaces/zod/zod.type";
import { sanitize } from "isomorphic-dompurify";

export const HTMLUtil = {
  sanitize: (dirty: string) => sanitize(dirty) as Branded<"SanitizedHTML">,
};
