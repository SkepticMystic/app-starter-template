import { apiKey } from "@better-auth/api-key";
import { passkey } from "@better-auth/passkey";
import { paystack } from "better-auth-paystack";
import { admin, emailOTP, organization, twoFactor } from "better-auth/plugins";
import { describe, expect, it } from "vite-plus/test";
import { make_better_auth } from "../../../test/better_auth.harness.js";
import { AUTH } from "./auth.const.js";

describe("AUTH.DISABLED_PATHS", () => {
  // `disabledPaths` is an exact match, and a path no route has 404s anyway, so
  // a typo would leave the real route open with nothing to say so.
  it("names only routes Better-Auth actually serves", () => {
    const auth = make_better_auth({
      user: { deleteUser: { enabled: true } },
      plugins: [
        organization(),
        admin(),
        emailOTP({ sendVerificationOTP: async () => {} }),
        twoFactor(),
        passkey(),
        apiKey([{ configId: "default", references: "organization" }]),
        paystack({
          // Only its routes are read; nothing here reaches Paystack.
          paystackClient: {} as never,
          secretKey: "sk_test",
          paystackWebhookSecret: "sk_test",
          organization: { enabled: true },
          subscription: { enabled: true, plans: [] },
        }),
      ],
    });

    const paths = new Set(Object.values(auth.api).map((e) => e.path));

    expect(AUTH.DISABLED_PATHS.filter((p) => !paths.has(p))).toEqual([]);
  });
});
