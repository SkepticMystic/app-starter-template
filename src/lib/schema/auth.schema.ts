import z from "zod";

export const AuthSchema = {
  signin_form: z.object({
    email: z.email("Invalid email address"),
    password: z.string(), // NOTE: Better-auth will do validation, so no need to do it here
    remember: z.boolean().default(false),
  }),
};
