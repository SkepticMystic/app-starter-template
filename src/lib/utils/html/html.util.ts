import type { Branded } from "$lib/interfaces/zod/zod.type";
import DOMPurify from "isomorphic-dompurify";

export const HTMLUtil = {
  sanitize: (dirty: string) => DOMPurify.sanitize(dirty) as Branded<'Sanitized'>,
};
