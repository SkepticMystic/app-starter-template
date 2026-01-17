import { AUTH } from "$lib/const/auth/auth.const";
import { zxcvbn } from "@zxcvbn-ts/core";
import z from "zod";

export const password_schema = z
  .string()
  .refine(
    (s) => zxcvbn(s).score >= AUTH.PASSWORD.MIN_SCORE,
    "Please choose a stronger password",
  );
