import { getRequestEvent } from "$app/server";
import type { AuditEvent } from "#lib/server/db/models/audit.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { RuntimeService } from "#lib/server/services/runtime/runtime.service.js";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { install_mock, mocks } from "../../../../test/helpers.js";
import { AuditQuery } from "./audit.query.js";
import { AuditService } from "./audit.service.js";
import { SecurityAlertService } from "./security_alert.service.js";

const CHROME_ON_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

const row = (over: Partial<AuditEvent>): AuditEvent => ({
  id: "event-1",
  type: "sign_in",
  user_id: "u1",
  actor_user_id: null,
  org_id: null,
  ip: null,
  user_agent: null,
  device: null,
  country: null,
  metadata: {},
  createdAt: new Date(),
  ...over,
});

const from_mac = {
  ip: "203.0.113.7",
  user_agent: CHROME_ON_MAC,
  device: "Chrome on macOS",
  country: "ZA",
};

/** `has_signed_in`, answering from a list of prior sign-ins' devices. */
const prior_sign_ins = (devices: string[]) =>
  install_mock(AuditQuery, {
    has_signed_in: async (input: { device?: string }) => ({
      ok: true,
      data: input.device ? devices.includes(input.device) : devices.length > 0,
    }),
  });

beforeEach(() => {
  install_mock(AuditQuery, {
    insert: async (values: Partial<AuditEvent>) => ({
      ok: true,
      data: row(values),
    }),
  });
  prior_sign_ins([]);
  install_mock(SecurityAlertService, {
    notify: async () => ({ ok: true, data: { sent: false } }),
  });
});

describe("AuditService.record", () => {
  it("writes the draft with where it came from, and offers it to the alerts", async () => {
    const res = await AuditService.record(
      { type: "password_changed", user_id: "u1", actor_user_id: "u1" },
      from_mac,
    );

    expect(mocks(AuditQuery).insert).toHaveBeenCalledWith({
      type: "password_changed",
      user_id: "u1",
      // Acting on yourself is not "by" anyone else.
      actor_user_id: null,
      org_id: null,
      metadata: {},
      ...from_mac,
    });
    expect(res.ok && res.data?.type).toBe("password_changed");
    expect(SecurityAlertService.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: "password_changed", user_id: "u1" }),
    );
  });

  it("flags a sign-in from a device the account has not used", async () => {
    prior_sign_ins(["Firefox on Windows"]);

    await AuditService.record(
      { type: "sign_in", user_id: "u1", metadata: { method: "credential" } },
      from_mac,
    );

    expect(mocks(AuditQuery).insert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { method: "credential", new_device: true },
      }),
    );
  });

  it("does not flag a known device, a first sign-in, or an unknown one", async () => {
    const metadata_after = async (devices: string[], device: string | null) => {
      prior_sign_ins(devices);
      await AuditService.record(
        { type: "sign_in", user_id: "u1", metadata: { method: "passkey" } },
        { ...from_mac, device },
      );
      return mocks(AuditQuery).insert.mock.lastCall?.[0].metadata;
    };

    const unflagged = { method: "passkey" };

    await expect(
      metadata_after(["Chrome on macOS"], "Chrome on macOS"),
    ).resolves.toEqual(unflagged);
    await expect(metadata_after([], "Chrome on macOS")).resolves.toEqual(
      unflagged,
    );
    await expect(metadata_after(["Chrome on macOS"], null)).resolves.toEqual(
      unflagged,
    );
  });

  it("does not flag a device when the lookup fails", async () => {
    install_mock(AuditQuery, {
      has_signed_in: async () => ({
        ok: false,
        error: { status: 500, message: "down" },
      }),
    });

    await AuditService.record(
      { type: "sign_in", user_id: "u1", metadata: { method: "credential" } },
      from_mac,
    );

    expect(mocks(AuditQuery).insert.mock.lastCall?.[0].metadata).toEqual({
      method: "credential",
    });
  });

  it("files a failed sign-in under the account that owns the address", async () => {
    vi.mocked(Repo.query).mockResolvedValue({ ok: true, data: { id: "u1" } });

    await AuditService.record({
      type: "sign_in_failed",
      user_id: null,
      email: " Victim@Example.com ",
      metadata: { method: "credential" },
    });

    expect(mocks(AuditQuery).insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "sign_in_failed", user_id: "u1" }),
    );
  });

  it("drops a failed sign-in for an address nobody owns", async () => {
    vi.mocked(Repo.query).mockResolvedValue({ ok: true, data: undefined });

    const res = await AuditService.record({
      type: "sign_in_failed",
      user_id: null,
      email: "nobody@example.com",
    });

    expect(res).toEqual({ ok: true, data: null });
    expect(AuditQuery.insert).not.toHaveBeenCalled();
  });

  it("sends no alert for a row it could not write", async () => {
    install_mock(AuditQuery, {
      insert: async () => ({
        ok: false,
        error: { status: 500, message: "down" },
      }),
    });

    const res = await AuditService.record({
      type: "two_factor_disabled",
      user_id: "u1",
    });

    expect(res.ok).toBe(false);
    expect(SecurityAlertService.notify).not.toHaveBeenCalled();
  });
});

describe("AuditService.after_endpoint", () => {
  it("records after the response, with the request's origin", async () => {
    vi.mocked(getRequestEvent).mockReturnValue({
      getClientAddress: () => "203.0.113.7",
      request: {
        headers: new Headers({
          "user-agent": CHROME_ON_MAC,
          "x-vercel-ip-country": "ZA",
        }),
      },
    } as unknown as ReturnType<typeof getRequestEvent>);

    AuditService.after_endpoint({
      path: "/two-factor/disable",
      returned: { status: true },
      session: {
        session: { id: "s1" },
        user: { id: "u1", email: "u1@example.com" },
      },
      new_session: null,
    });
    await RuntimeService.drain(1_000);

    expect(mocks(AuditQuery).insert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "two_factor_disabled",
        user_id: "u1",
        ...from_mac,
      }),
    );
  });

  it("records outside a request too, without an origin", async () => {
    AuditService.after_endpoint({
      path: "/two-factor/disable",
      returned: { status: true },
      session: {
        session: { id: "s1" },
        user: { id: "u1", email: "u1@example.com" },
      },
      new_session: null,
    });
    await RuntimeService.drain(1_000);

    expect(mocks(AuditQuery).insert).toHaveBeenCalledWith(
      expect.objectContaining({ ip: null, device: null, country: null }),
    );
  });

  it("writes nothing for a call that is no event", async () => {
    AuditService.after_endpoint({
      path: "/get-session",
      returned: {},
      session: null,
      new_session: null,
    });
    await RuntimeService.drain(1_000);

    expect(AuditQuery.insert).not.toHaveBeenCalled();
  });
});

describe("AuditService.on_account_created", () => {
  it("records a provider linked to an existing account", async () => {
    vi.mocked(Repo.query).mockResolvedValue({
      ok: true,
      data: { createdAt: new Date("2026-01-01") },
    });

    AuditService.on_account_created({
      userId: "u1",
      providerId: "google",
      createdAt: new Date("2026-10-01"),
    });
    await RuntimeService.drain(1_000);

    expect(mocks(AuditQuery).insert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "account_linked",
        user_id: "u1",
        metadata: { provider: "google" },
      }),
    );
  });

  it("ignores the account a sign-up is created with", async () => {
    const now = new Date();
    vi.mocked(Repo.query).mockResolvedValue({
      ok: true,
      data: { createdAt: now },
    });

    AuditService.on_account_created({
      userId: "u1",
      providerId: "credential",
      createdAt: now,
    });
    await RuntimeService.drain(1_000);

    expect(AuditQuery.insert).not.toHaveBeenCalled();
  });
});
