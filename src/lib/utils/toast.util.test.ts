import { ERROR } from "#lib/const/error.const.js";
import { describe, expect, it } from "vite-plus/test";
import { Toast } from "./toast.util.js";

const PENDING = "This email already has a pending invite.";

describe("Toast.from_error", () => {
  it("heads a CONFLICT with its category and puts the detail under it", () => {
    expect(Toast.from_error({ ...ERROR.CONFLICT, message: PENDING })).toEqual({
      title: "Conflict",
      description: PENDING,
    });
  });

  it("heads a TOO_MANY_REQUESTS so the wait is the detail", () => {
    expect(
      Toast.from_error({
        ...ERROR.TOO_MANY_REQUESTS,
        message: "Try again in 30 seconds",
      }),
    ).toEqual({
      title: "Too many requests",
      description: "Try again in 30 seconds",
    });
  });

  it("leaves a taxonomy code alone", () => {
    expect(
      Toast.from_error({ ...ERROR.INVALID_INPUT, message: "Not a valid URL" }),
    ).toBe("Not a valid URL");

    expect(
      Toast.from_error({
        ...ERROR.FORBIDDEN,
        message: "Only an owner can remove a member",
      }),
    ).toBe("Only an owner can remove a member");
  });

  it("keeps one line when the canonical message was left alone", () => {
    expect(Toast.from_error(ERROR.CONFLICT)).toBe("Conflict");
  });

  it("ignores casing and a trailing stop when comparing", () => {
    expect(Toast.from_error({ ...ERROR.CONFLICT, message: "conflict." })).toBe(
      "conflict.",
    );
  });

  it("keeps one line for a hand-built error with no code", () => {
    expect(Toast.from_error({ status: 400, message: "Action cancelled" })).toBe(
      "Action cancelled",
    );
  });

  it("lets an explicit description override the derivation", () => {
    expect(
      Toast.from_error({
        ...ERROR.CONFLICT,
        message: "That slug is taken",
        description: "Pick another, or rename the other organization first.",
      }),
    ).toEqual({
      title: "That slug is taken",
      description: "Pick another, or rename the other organization first.",
    });
  });
});
