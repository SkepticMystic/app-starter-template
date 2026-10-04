import { EmailService } from "#lib/server/services/email.service.js";
import { describe, expect, it, vi } from "vite-plus/test";
import { ratelimit } from "../../../../../test/rate_limit.mock.js";
import { ExistingAccountService } from "./existing_account.service.js";

const USER = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Ada",
  email: "ada@example.com",
  emailVerified: true,
};

describe("ExistingAccountService.notify", () => {
  it("tells the owner, at the account's own address", async () => {
    await expect(ExistingAccountService.notify(USER)).resolves.toEqual({
      ok: true,
      data: { sent: true },
    });

    const sent = vi.mocked(EmailService.send).mock.lastCall?.[0];
    expect(sent?.to).toBe("ada@example.com");
    expect(sent?.subject).toMatch(/^You already have a .+ account$/);
    expect(sent?.text).toContain("as ada@example.com");
  });

  it("is limited per account, not per address typed", async () => {
    await ExistingAccountService.notify(USER);

    expect(ratelimit.limit.mock.lastCall?.[0]).toBe(USER.id);
  });

  it("never mails an address its owner has not verified", async () => {
    await expect(
      ExistingAccountService.notify({ ...USER, emailVerified: false }),
    ).resolves.toEqual({ ok: true, data: { sent: false } });

    expect(ratelimit.limit).not.toHaveBeenCalled();
    expect(EmailService.send).not.toHaveBeenCalled();
  });

  it("stays quiet once the account has had its share", async () => {
    ratelimit.limit.mockResolvedValue({
      success: false,
      remaining: 0,
      limit: 2,
      reset: Date.now() + 60_000,
      pending: Promise.resolve(),
    });

    await expect(ExistingAccountService.notify(USER)).resolves.toEqual({
      ok: true,
      data: { sent: false },
    });
    expect(EmailService.send).not.toHaveBeenCalled();
  });
});
