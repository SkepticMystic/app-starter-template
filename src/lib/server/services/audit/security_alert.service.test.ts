import type { AuditEvent } from "#lib/server/db/models/audit.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { EmailService } from "#lib/server/services/email.service.js";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

// The subject is on the wall, so its tests ask for the real one.
const { SecurityAlertService } = await vi.importActual<
  typeof import("./security_alert.service.js")
>("./security_alert.service.js");

const event = (over: Partial<AuditEvent>): AuditEvent => ({
  id: "event-1",
  type: "sign_in",
  user_id: "u1",
  actor_user_id: null,
  org_id: null,
  ip: "203.0.113.7",
  user_agent: null,
  device: "Chrome on macOS",
  country: "ZA",
  metadata: {},
  createdAt: new Date("2026-10-04T08:00:00Z"),
  ...over,
});

const owner = (over?: { emailVerified?: boolean }) =>
  vi.mocked(Repo.query).mockResolvedValue({
    ok: true,
    data: {
      name: "<b>Ada</b>",
      email: "ada@example.com",
      emailVerified: over?.emailVerified ?? true,
    },
  });

describe("SecurityAlertService.alert_for", () => {
  it("alerts on a sign-in only from a new device", () => {
    expect(
      SecurityAlertService.alert_for(
        event({ metadata: { method: "google", new_device: true } }),
      )?.title,
    ).toBe("New sign-in to your account");

    expect(
      SecurityAlertService.alert_for(event({ metadata: { method: "google" } })),
    ).toBeNull();
  });

  it("says when an administrator set the password", () => {
    expect(
      SecurityAlertService.alert_for(
        event({ type: "password_changed", actor_user_id: "admin" }),
      )?.detail,
    ).toMatch(/administrator/);
  });

  it("stays quiet while an admin is impersonating", () => {
    expect(
      SecurityAlertService.alert_for(
        event({
          type: "two_factor_disabled",
          metadata: { impersonated: true },
        }),
      ),
    ).toBeNull();
  });

  it("leaves moderation and routine events to the log", () => {
    for (const type of [
      "user_banned",
      "session_revoked",
      "org_member_joined",
    ] as const) {
      expect(SecurityAlertService.alert_for(event({ type }))).toBeNull();
    }
  });
});

describe("SecurityAlertService.notify", () => {
  beforeEach(() => {
    vi.mocked(EmailService.send).mockResolvedValue({
      ok: true,
      data: undefined,
    });
  });

  it("emails the owner, escaping what they control", async () => {
    owner();

    const res = await SecurityAlertService.notify(
      event({ type: "two_factor_disabled" }),
    );

    expect(res).toEqual({ ok: true, data: { sent: true } });

    const sent = vi.mocked(EmailService.send).mock.lastCall?.[0];
    expect(sent?.to).toBe("ada@example.com");
    expect(sent?.subject).toMatch(/^Two-factor authentication was turned off/);
    expect(sent?.text).toContain("Device: Chrome on macOS");
    expect(sent?.text).toContain("Location: ZA");
    expect(sent?.html).not.toContain("<b>Ada");
    expect(sent?.html).toContain("&lt;b>Ada&lt;/b>");
  });

  it("does not mail an unverified address", async () => {
    owner({ emailVerified: false });

    const res = await SecurityAlertService.notify(
      event({ type: "password_changed" }),
    );

    expect(res).toEqual({ ok: true, data: { sent: false } });
    expect(EmailService.send).not.toHaveBeenCalled();
  });

  it("tells the address an email change moved away from", async () => {
    owner();

    await SecurityAlertService.notify(
      event({
        type: "email_changed",
        metadata: { from: "old@example.com", to: "new@example.com" },
      }),
    );

    expect(vi.mocked(EmailService.send).mock.lastCall?.[0].to).toBe(
      "old@example.com",
    );
  });

  it("looks nobody up for an event that sends nothing", async () => {
    const res = await SecurityAlertService.notify(
      event({ type: "session_revoked" }),
    );

    expect(res).toEqual({ ok: true, data: { sent: false } });
    expect(Repo.query).not.toHaveBeenCalled();
  });
});
