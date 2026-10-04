import type { Branded } from "#lib/interfaces/zod/zod.type.js";
import dns from "node:dns/promises";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { EmailValidationService } from "./email_validation.service.js";

const email = (value: string) => value as Branded<"EmailAddress">;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EmailValidationService.is_disposable", () => {
  it("knows a throwaway provider, whatever the case", () => {
    expect(EmailValidationService.is_disposable("a@mailinator.com")).toBe(true);
    expect(EmailValidationService.is_disposable("a@MailInator.COM")).toBe(true);
  });

  it("counts a provider's subdomains as the provider", () => {
    expect(EmailValidationService.is_disposable("a@inbox.mailinator.com")).toBe(
      true,
    );
  });

  it("leaves real mailbox providers alone", () => {
    for (const domain of [
      "gmail.com",
      "outlook.com",
      "icloud.com",
      "proton.me",
    ]) {
      expect(EmailValidationService.is_disposable(`a@${domain}`)).toBe(false);
    }
  });

  it("never matches on the bare TLD", () => {
    expect(EmailValidationService.is_disposable("a@com")).toBe(false);
  });
});

describe("EmailValidationService.refusal", () => {
  it("refuses a disposable address without a DNS lookup", async () => {
    const lookup = vi.spyOn(dns, "resolveMx");

    await expect(
      EmailValidationService.refusal(email("a@mailinator.com")),
    ).resolves.toEqual({
      ok: true,
      data: "Disposable email addresses can't be used",
    });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("refuses a domain that takes no mail", async () => {
    vi.spyOn(dns, "resolveMx").mockRejectedValue(
      Object.assign(new Error("queryMx ENOTFOUND nope.example"), {
        code: "ENOTFOUND",
      }),
    );

    await expect(
      EmailValidationService.refusal(email("a@nope.example")),
    ).resolves.toEqual({ ok: true, data: "Email address is not valid" });
  });

  it("accepts a domain with mail servers", async () => {
    vi.spyOn(dns, "resolveMx").mockResolvedValue([
      { exchange: "mx.example.com", priority: 10 },
    ]);

    await expect(
      EmailValidationService.refusal(email("a@example.com")),
    ).resolves.toEqual({ ok: true, data: null });
  });
});
