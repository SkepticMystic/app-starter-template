import { beforeEach, describe, expect, it } from "vite-plus/test";
import { auth_mock } from "../../../../../test/auth.mock.js";
import { with_request } from "../../../../../test/helpers.js";
import { UserSessionService } from "./user_session.service.js";

beforeEach(() => {
  with_request();
});

describe("UserSessionService.sign_out", () => {
  it("answers no url when there is no provider to sign out of", async () => {
    const res = await UserSessionService.sign_out();

    expect(res).toEqual({ ok: true, data: { url: null } });
  });

  it("passes on the provider's end-session page", async () => {
    const url = "https://id.example.com/api/oidc/end-session?client_id=x";
    auth_mock.signOut.mockResolvedValue({ success: true, url, redirect: true });

    const res = await UserSessionService.sign_out();

    expect(res).toEqual({ ok: true, data: { url } });
  });
});
