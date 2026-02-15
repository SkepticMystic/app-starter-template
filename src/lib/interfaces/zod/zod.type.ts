import type { z } from "zod/mini";

export type Branded<
  B extends "SanitizedHTML" | "PrerenderedHTML",
  T = string,
> = T & z.$brand<B>;
