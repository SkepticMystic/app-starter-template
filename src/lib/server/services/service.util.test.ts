import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { makeSession } from "../../../test/helpers";
import { ba_error, session_member, session_org } from "./service.util";

const log = { error: vi.fn(), info: vi.fn() };

beforeEach(() => {
  vi.mocked(captureException).mockClear();
});

// A refusal is not filed; a 5xx or a non-`APIError` is.
describe("ba_error", () => {
  it("relays a Better-Auth refusal without filing it", () => {
    const res = ba_error(
      new APIError("BAD_REQUEST", { message: "Slug taken" }),
      { log },
    );

    expect(res).toMatchObject({ ok: false, error: { status: 400 } });
    expect(captureException).not.toHaveBeenCalled();
  });

  it("files a Better-Auth 5xx", () => {
    const error = new APIError("INTERNAL_SERVER_ERROR");

    ba_error(error, { log });

    expect(captureException).toHaveBeenCalledWith(error);
  });

  it("files anything that is not an APIError, and answers 500", () => {
    const error = new Error("boom");

    const res = ba_error(error, { log });

    expect(res).toMatchObject({ ok: false, error: { status: 500 } });
    expect(captureException).toHaveBeenCalledWith(error);
  });
});

describe("session_org / session_member", () => {
  it("hands back the ids of a session acting in an org", () => {
    const session = makeSession({ orgId: "org-1", memberId: "member-9" });

    expect(session_org(session)).toEqual({ ok: true, data: "org-1" });
    expect(session_member(session)).toEqual({ ok: true, data: "member-9" });
  });

  it("refuses a session with no active org", () => {
    const session = makeSession({ orgId: null });

    expect(session_org(session)).toMatchObject({
      ok: false,
      error: { status: 403 },
    });
    expect(session_member(session)).toMatchObject({
      ok: false,
      error: { status: 403 },
    });
  });
});
