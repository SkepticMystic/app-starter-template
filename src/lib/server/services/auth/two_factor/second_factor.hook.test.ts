import { APIError } from "better-auth";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { describe, expect, it } from "vite-plus/test";
import {
  make_better_auth,
  PASSWORD,
} from "../../../../../test/better_auth.harness.js";
import { SecondFactorHook } from "./second_factor.hook.js";

/** The parts of `auth.ts` this guard answers for, over a real Better-Auth. */
const setup = async () => {
  const codes: string[] = [];

  const auth = make_better_auth({
    databaseHooks: {
      session: {
        create: {
          before: async (session, ctx) => {
            await SecondFactorHook.refuse_code_sign_in(session, ctx);
          },
        },
      },
    },
    disabledPaths: ["/email-otp/send-verification-otp", "/sign-in/email-otp"],
    plugins: [
      twoFactor(),
      emailOTP({
        storeOTP: "hashed",
        disableSignUp: true,
        sendVerificationOTP: async ({ otp }) => {
          codes.push(otp);
        },
      }),
    ],
  });

  const { internalAdapter } = await auth.$context;

  const account = async (email: string, opts: { two_factor: boolean }) => {
    const res = await auth.api.signUpEmail({
      body: { email, password: PASSWORD, name: "Agent" },
    });
    if (opts.two_factor) {
      await internalAdapter.updateUser(res.user.id, { twoFactorEnabled: true });
    }
  };

  /** Asks for a code and redeems it, as the two remotes do. */
  const sign_in_by_code = async (email: string) => {
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });

    return auth.api.signInEmailOTP({
      body: { email, otp: codes.at(-1) ?? "" },
    });
  };

  return { auth, account, sign_in_by_code };
};

const refusal_of = async (attempt: Promise<unknown>) => {
  try {
    await attempt;
  } catch (error) {
    return error instanceof APIError ? error : null;
  }
  return null;
};

describe("SecondFactorHook.refuse_code_sign_in", () => {
  it("refuses an emailed code for an account with a second factor", async () => {
    const { account, sign_in_by_code } = await setup();
    await account("guarded@example.com", { two_factor: true });

    const refusal = await refusal_of(sign_in_by_code("guarded@example.com"));

    expect(refusal?.status).toBe("FORBIDDEN");
    expect(refusal?.body?.code).toBe("TWO_FACTOR_REQUIRED");
  });

  it("lets an emailed code sign in an account without one", async () => {
    const { account, sign_in_by_code } = await setup();
    await account("plain@example.com", { two_factor: false });

    const res = await sign_in_by_code("plain@example.com");

    expect(res.token).toEqual(expect.any(String));
  });

  it("leaves password sign-in to `twoFactor`", async () => {
    const { auth, account } = await setup();
    await account("guarded@example.com", { two_factor: true });

    const res = await auth.api.signInEmail({
      body: { email: "guarded@example.com", password: PASSWORD },
    });

    expect(res).toMatchObject({ twoFactorRedirect: true });
  });
});

describe("disabledPaths", () => {
  it("closes the code routes to HTTP, though `auth.api` reaches them", async () => {
    const { auth } = await setup();

    const res = await auth.handler(
      new Request("http://localhost:5173/api/auth/sign-in/email-otp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:5173",
        },
        body: JSON.stringify({ email: "a@example.com", otp: "123456" }),
      }),
    );

    expect(res.status).toBe(404);
  });
});
