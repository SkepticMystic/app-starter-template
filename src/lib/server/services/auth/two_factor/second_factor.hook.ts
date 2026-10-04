import { EMAIL_OTP } from "#lib/const/auth/email_otp.const.js";
import { APIError, type GenericEndpointContext } from "better-auth";

/**
 * Refuses a session that an emailed code alone would start for an account
 * with a second factor. For `databaseHooks.session.create.before`.
 *
 * `twoFactor` intercepts only password sign-ins (`/sign-in/email` and kin), so
 * without this a code would sign such an account in on inbox access alone. It
 * runs once the code has been redeemed, so the refusal tells nobody without
 * the inbox anything. A failed lookup throws, so it fails closed.
 */
const refuse_code_sign_in = async (
  session: { userId: string },
  ctx: GenericEndpointContext | null,
): Promise<void> => {
  if (ctx?.path !== "/sign-in/email-otp") return;

  const user = await ctx.context.internalAdapter.findUserById(session.userId);

  // The plugin's field, which Better-Auth's core `User` type does not declare.
  if (!user || ("twoFactorEnabled" in user && user.twoFactorEnabled)) {
    throw APIError.from("FORBIDDEN", EMAIL_OTP.ERRORS.TWO_FACTOR_REQUIRED);
  }
};

export const SecondFactorHook = { refuse_code_sign_in };
