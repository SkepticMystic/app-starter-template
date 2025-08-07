import { auth } from "$lib/auth/lucia";
import { OTP, OTPs, type TeamInviteOTP } from "$lib/models/OTPs";
import { Teams } from "$lib/models/Teams";
import { password_schema } from "$lib/schema/index";
import { Parsers } from "$lib/schema/parsers";
import { type Actions, error, redirect } from "@sveltejs/kit";
import type { User } from "lucia";
import { z } from "zod";

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const { email, password } = await Parsers.form(
      request,
      z.object({ email: z.email(), password: password_schema }),
    );

    const { team_token } = Parsers.url(
      url,
      z.object({ team_token: z.string().optional() }),
    );

    // SECTION: Team

    let attributes: Pick<User, "email_verified" | "role" | "team_id">;

    if (team_token) {
      // Find and delete the OTP
      const otp = (await OTPs.findOneAndDelete({
        token: team_token,
        kind: "team-invite",
        identifier: `email:${email}`,
      }).lean()) as TeamInviteOTP | null;
      if (!otp) error(400, "Invalid team token");

      attributes = {
        email_verified: true,
        role: otp.data.role,
        team_id: otp.data.team_id,
      };
    } else {
      const team = await Teams.create({});
      attributes = {
        email_verified: false,
        role: "owner",
        team_id: team._id.toString(),
      };
    }
    console.log({ email, password, attributes });
    // !SECTION

    try {
      const user = await auth.createUser({
        attributes: { ...attributes, email, admin: false },
        key: { password, providerId: "email", providerUserId: email },
      });

      const promises: Promise<any>[] = [
        auth.createSession({ userId: user.userId, attributes: {} }),
      ];

      if (!attributes.email_verified) {
        promises.push(OTP.handleLinks["email-verification"]({ user }));
      }

      const [session] = await Promise.all(promises);
      locals.auth.setSession(session);
    } catch (e) {
      const { message } = e as Error;
      if (
        message === "AUTH_DUPLICATE_KEY_ID" ||
        message === "AUTH_DUPLICATE_USER_DATA"
      ) {
        error(400, "Email already in use");
      }

      error(500, "Something went wrong");
    }

    redirect(302, "/");
  },
};
