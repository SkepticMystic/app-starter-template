import { memoryAdapter } from "better-auth/adapters/memory";
import { betterAuth, type BetterAuthOptions } from "better-auth/minimal";

/**
 * A real Better-Auth over memory, configured as `auth.ts` is where it matters
 * to these tests — sessions and verifications only in `secondaryStorage` — so
 * a test asserts what Better-Auth actually does with our hooks and plugins,
 * not what a fake agrees with us it does.
 */
export const make_better_auth = <const O extends Partial<BetterAuthOptions>>(
  options: O,
) => {
  const kv = new Map<string, string>();

  return betterAuth({
    baseURL: "http://localhost:5173",
    secret: "better-auth-harness-secret-0123456789abcdef",
    database: memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
      twoFactor: [],
    }),
    secondaryStorage: {
      get: async (key) => kv.get(key) ?? null,
      set: async (key, value) => {
        kv.set(key, value);
      },
      delete: async (key) => {
        kv.delete(key);
      },
      getAndDelete: async (key) => {
        const value = kv.get(key) ?? null;
        kv.delete(key);
        return value;
      },
      increment: async (key) => {
        const next = Number(kv.get(key) ?? 0) + 1;
        kv.set(key, String(next));
        return next;
      },
    },
    session: { storeSessionInDatabase: false },
    verification: { storeInDatabase: false },
    emailAndPassword: { enabled: true },
    logger: { disabled: true },
    ...options,
  });
};

export const PASSWORD = "correct horse battery staple";
