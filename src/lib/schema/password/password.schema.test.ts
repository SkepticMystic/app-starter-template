import { AUTH } from "#lib/const/auth/auth.const.js";
import { describe, expect, it } from "vite-plus/test";
import { existing_password_schema, password_schema } from "./password.schema";

// Strong enough for zxcvbn, so only the length rules are under test.
const strong = (length: number) =>
  "correct-Horse-battery-staple-".repeat(10).slice(0, length);

describe("password_schema", () => {
  it("accepts a strong password within Better-Auth's bounds", async () => {
    expect((await password_schema.safeParseAsync(strong(20))).success).toBe(
      true,
    );
  });

  it("refuses one past the maximum, as Better-Auth would", async () => {
    const res = await password_schema.safeParseAsync(
      strong(AUTH.PASSWORD.MAX_LENGTH + 1),
    );

    expect(res.success).toBe(false);
  });

  it("refuses one under the minimum, saying why", async () => {
    const res = await password_schema.safeParseAsync(
      strong(AUTH.PASSWORD.MIN_LENGTH - 1),
    );

    expect(res.error?.issues.map((issue) => issue.code)).toContain("too_small");
  });

  it("refuses a long password the dictionaries know, saying why", async () => {
    const res = await password_schema.safeParseAsync("Password123");

    expect(res.error?.issues.map((issue) => issue.message)).toEqual([
      "Please choose a stronger password",
    ]);
  });
});

describe("existing_password_schema", () => {
  it("accepts a short password set under a laxer rule", () => {
    expect(existing_password_schema.safeParse("abc").success).toBe(true);
  });

  it("refuses one Better-Auth would answer PASSWORD_TOO_LONG to", () => {
    expect(
      existing_password_schema.safeParse(
        "a".repeat(AUTH.PASSWORD.MAX_LENGTH + 1),
      ).success,
    ).toBe(false);
  });
});
