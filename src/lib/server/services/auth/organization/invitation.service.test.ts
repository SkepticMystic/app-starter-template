import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import { auth_mock } from "../../../../../test/auth.mock.js";
import { with_request } from "../../../../../test/helpers.js";
import { InvitationService } from "./invitation.service.js";

const ORG = "11111111-1111-4111-8111-111111111111";
const INPUT = {
  email: "new@example.com",
  role: "member" as const,
  organizationId: ORG,
};

const refuse = (status: "BAD_REQUEST" | "FORBIDDEN", code: string) =>
  new APIError(status, { code, message: code });

beforeEach(() => {
  with_request();

  // The real matcher, so a code reaches the branch it names.
  auth_mock.is_ba_error_code.mockImplementation(
    (error: APIError, ...codes: string[]) =>
      codes.includes(error.body?.code ?? ""),
  );
});

describe("InvitationService.create", () => {
  it("creates in the org it is given, not the session's active one", async () => {
    auth_mock.createInvitation.mockResolvedValue({ id: "i-1" });

    const res = await InvitationService.create(INPUT);

    expect(res.ok).toBe(true);
    expect(auth_mock.createInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({ organizationId: ORG }),
      }),
    );
  });

  it.each([
    ["USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION", ["email"]],
    ["USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION", ["email"]],
    ["YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE", ["role"]],
  ])("pins %s to its field", async (code, path) => {
    auth_mock.createInvitation.mockRejectedValue(refuse("BAD_REQUEST", code));

    const res = await InvitationService.create(INPUT);

    expect(res.ok).toBe(false);
    expect(!res.ok && res.error.path).toEqual(path);
    expect(captureException).not.toHaveBeenCalled();
  });

  it("relays any other refusal with its status, without filing it", async () => {
    auth_mock.createInvitation.mockRejectedValue(
      refuse("FORBIDDEN", "INVITATION_LIMIT_REACHED"),
    );

    const res = await InvitationService.create(INPUT);

    expect(!res.ok && res.error.status).toBe(403);
    expect(captureException).not.toHaveBeenCalled();
  });

  it("files a Better-Auth 5xx", async () => {
    auth_mock.createInvitation.mockRejectedValue(
      new APIError("INTERNAL_SERVER_ERROR"),
    );

    const res = await InvitationService.create(INPUT);

    expect(!res.ok && res.error.status).toBe(500);
    expect(captureException).toHaveBeenCalledOnce();
  });
});
