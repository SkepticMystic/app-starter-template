import type { z } from "zod/mini";

export type Branded<B extends 'Sanitized'> = string & z.$brand<B>;
