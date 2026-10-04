import { AccountDeletionService } from "#lib/server/services/auth/user/account_deletion.service.js";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { auth_mock } from "../../../../../test/auth.mock.js";
import { with_request } from "../../../../../test/helpers.js";
import { AdminService } from "./admin.service.js";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ADMIN_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  with_request();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdminService.ban", () => {
  it("answers only the ban fields, not the user row", async () => {
    const banExpires = new Date("2026-11-01T00:00:00Z");
    auth_mock.banUser.mockResolvedValue({
      user: {
        id: USER_ID,
        email: "banned@example.com",
        role: "user",
        banned: true,
        banReason: "spam",
        banExpires,
      },
    });

    const res = await AdminService.ban({ userId: USER_ID, banReason: "spam" });

    expect(res).toEqual({
      ok: true,
      data: { user: { banned: true, banReason: "spam", banExpires } },
    });
  });

  it("relays a refusal with its status, without filing it", async () => {
    auth_mock.banUser.mockRejectedValue(
      new APIError("BAD_REQUEST", {
        code: "YOU_CANNOT_BAN_YOURSELF",
        message: "You cannot ban yourself",
      }),
    );

    const res = await AdminService.ban({ userId: USER_ID });

    expect(!res.ok && res.error.status).toBe(400);
    expect(captureException).not.toHaveBeenCalled();
  });
});

describe("AdminService.unban", () => {
  it("fills the fields Better-Auth leaves unset", async () => {
    auth_mock.unbanUser.mockResolvedValue({
      user: { id: USER_ID, banned: null },
    });

    const res = await AdminService.unban(USER_ID);

    expect(res).toEqual({
      ok: true,
      data: { user: { banned: false, banReason: null, banExpires: null } },
    });
  });
});

describe("AdminService.remove", () => {
  it("refuses removing yourself before checking or cancelling anything", async () => {
    const before = vi.spyOn(AccountDeletionService, "before");

    const res = await AdminService.remove(ADMIN_ID, ADMIN_ID);

    expect(!res.ok && res.error.status).toBe(400);
    expect(before).not.toHaveBeenCalled();
    expect(auth_mock.removeUser).not.toHaveBeenCalled();
  });

  it("never reaches Better-Auth when the deletion is refused", async () => {
    vi.spyOn(AccountDeletionService, "before").mockRejectedValue(
      new APIError("BAD_REQUEST", {
        message: "This account can't be deleted yet",
      }),
    );

    const res = await AdminService.remove(USER_ID, ADMIN_ID);

    expect(!res.ok && res.error).toMatchObject({
      status: 400,
      message: "This account can't be deleted yet",
    });
    expect(auth_mock.removeUser).not.toHaveBeenCalled();
  });

  it("checks the deletion before Better-Auth removes anything", async () => {
    const order: string[] = [];
    vi.spyOn(AccountDeletionService, "before").mockImplementation(async () => {
      order.push("before");
    });
    auth_mock.removeUser.mockImplementation(async () => {
      order.push("removeUser");
      return { success: true };
    });

    const res = await AdminService.remove(USER_ID, ADMIN_ID);

    expect(res.ok).toBe(true);
    expect(order).toEqual(["before", "removeUser"]);
  });
});
