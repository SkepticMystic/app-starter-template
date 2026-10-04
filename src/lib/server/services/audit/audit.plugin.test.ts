import { twoFactor } from "better-auth/plugins";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  make_better_auth,
  PASSWORD,
} from "../../../../test/better_auth.harness.js";
import { audit_plugin } from "./audit.plugin.js";
import { AuditCapture, type EndpointCall } from "./audit_capture.js";

/**
 * Over a real Better-Auth, because the property under test is Better-Auth's:
 * what an after-hook sees depends on where it sits among the plugins' hooks.
 */
const setup = async (order: "after_two_factor" | "before_two_factor") => {
  const on_call = vi.fn<(call: EndpointCall) => void>();

  const auth = make_better_auth({
    plugins:
      order === "after_two_factor"
        ? [twoFactor(), audit_plugin(on_call)]
        : [audit_plugin(on_call), twoFactor()],
  });

  const { internalAdapter } = await auth.$context;

  const account = async (email: string, opts: { two_factor: boolean }) => {
    const res = await auth.api.signUpEmail({
      body: { email, password: PASSWORD, name: "Agent" },
    });
    if (opts.two_factor) {
      await internalAdapter.updateUser(res.user.id, { twoFactorEnabled: true });
    }
    return res.user.id;
  };

  /** What the hook was handed for the last call to `path`. */
  const last_call = (path: string) =>
    on_call.mock.calls.findLast(([call]) => call.path === path)?.[0];

  return { auth, account, last_call };
};

describe("audit_plugin", () => {
  it("records a completed password sign-in", async () => {
    const { auth, account, last_call } = await setup("after_two_factor");
    const user_id = await account("plain@example.com", { two_factor: false });

    await auth.api.signInEmail({
      body: { email: "plain@example.com", password: PASSWORD },
    });

    const call = last_call("/sign-in/email");
    expect(call && AuditCapture.capture(call)).toEqual([
      { type: "sign_in", user_id, metadata: { method: "credential" } },
    ]);
  });

  it("records nothing for a password sign-in still owed a second factor", async () => {
    const { auth, account, last_call } = await setup("after_two_factor");
    await account("guarded@example.com", { two_factor: true });

    await auth.api.signInEmail({
      body: { email: "guarded@example.com", password: PASSWORD },
    });

    const call = last_call("/sign-in/email");
    expect(call?.new_session).toBeNull();
    expect(call && AuditCapture.capture(call)).toEqual([]);
  });

  it("would record that sign-in if it ran before `twoFactor` — why it is listed after", async () => {
    const { auth, account, last_call } = await setup("before_two_factor");
    await account("guarded@example.com", { two_factor: true });

    await auth.api.signInEmail({
      body: { email: "guarded@example.com", password: PASSWORD },
    });

    expect(last_call("/sign-in/email")?.new_session).not.toBeNull();
  });

  it("hands over a refused sign-in's error, for a failed-attempt event", async () => {
    const { auth, account, last_call } = await setup("after_two_factor");
    await account("plain@example.com", { two_factor: false });

    await expect(
      auth.api.signInEmail({
        body: { email: "plain@example.com", password: "wrong password" },
      }),
    ).rejects.toThrow(/invalid email or password/i);

    const call = last_call("/sign-in/email");
    expect(call && AuditCapture.capture(call)).toEqual([
      expect.objectContaining({
        type: "sign_in_failed",
        email: "plain@example.com",
      }),
    ]);
  });
});
