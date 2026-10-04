import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import { auth_mock } from "../../../../../test/auth.mock.js";
import { with_request } from "../../../../../test/helpers.js";
import { AdminService } from "./admin.service.js";

const USER_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  with_request();
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
