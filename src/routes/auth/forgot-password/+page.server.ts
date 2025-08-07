import { Users } from "$lib/auth/lucia";
import { OTP } from "$lib/models/OTPs";
import { Parsers } from "$lib/schema/parsers";
import type { Actions } from "@sveltejs/kit";
import { z } from "zod";

export const actions: Actions = {
  default: async ({ request, url }) => {
    const { email } = await Parsers.form(
      request,
      z.object({ email: z.email() }),
    );

    const user = await Users.findOne({ email }).lean();

    // Don't reveal whether the email exists or not
    if (!user) {
      console.log("User not found");
      return { ok: true };
    }

    await OTP.handleLinks["password-reset"]({ user });

    return { ok: true };
  },
};
