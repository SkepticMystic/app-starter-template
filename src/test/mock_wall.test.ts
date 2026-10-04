import { DATABASE_URL, LOG_LEVEL } from "$app/env/private";
import { PUBLIC_BASE_URL } from "$app/env/public";
import { OrganizationRepo } from "#lib/server/db/repos/organization.repo.js";
import { describe, expect, it } from "vite-plus/test";
import { set_env } from "./env.mock.js";
import { install_mock, mocks } from "./helpers.js";

/** The wall's own guarantees, which every other suite leans on without saying so. */

describe("the env mock", () => {
  it("is derived from src/env.ts, placeholders and defaults included", () => {
    expect(PUBLIC_BASE_URL).toBe("http://localhost:5173");
    expect(DATABASE_URL).toMatch(/^postgresql:\/\//);
    expect(LOG_LEVEL).toBe("silent");
  });

  it("lets a test override a private variable, read at call time", () => {
    set_env({ LOG_LEVEL: "debug" });

    expect(LOG_LEVEL).toBe("debug");
  });

  it("resets an override before the next test", () => {
    expect(LOG_LEVEL).toBe("silent");
  });
});

describe("install_mock", () => {
  it("installs an implementation on a mocked function", async () => {
    install_mock(OrganizationRepo, {
      get_membership: async () => ({ ok: true, data: undefined }),
    });

    await expect(
      OrganizationRepo.get_membership({ org_id: "o", user_id: "u" }),
    ).resolves.toEqual({ ok: true, data: undefined });
  });

  it("refuses a name the real module does not have", () => {
    expect(() => install_mock(OrganizationRepo, { renamed: () => 1 })).toThrow(
      /no such member/,
    );
  });

  it("is undone by the reset before each test", async () => {
    expect(mocks(OrganizationRepo).get_membership).not.toHaveBeenCalled();
    await expect(
      OrganizationRepo.get_membership({ org_id: "o", user_id: "u" }),
    ).resolves.toBeUndefined();
  });
});
