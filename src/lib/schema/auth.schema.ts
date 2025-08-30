import z from "zod";

export const AuthSchema = {
  signup_form: z.object({
    password: z.string(),
    remember: z.boolean().default(false),
    email: z.email("Invalid email address"),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
  }),

  signin_form: z.object({
    email: z.email("Invalid email address"),
    password: z.string(), // NOTE: Better-auth will do validation, so no need to do it here
    remember: z.boolean().default(false),
  }),
};
