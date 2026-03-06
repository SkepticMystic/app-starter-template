import type { z } from "zod/mini";

export type Branded<
  B extends "SanitizedHTML" | "PrerenderedHTML" | "EmailAddress",
  T = string,
> = T & z.$brand<B>;
