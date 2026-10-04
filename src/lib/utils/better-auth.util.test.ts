import { describe, expect, it } from "vite-plus/test";
import { BetterAuth } from "./better-auth.util";

describe("BetterAuth.to_result", () => {
  it("treats a success with falsy data as a success", async () => {
    await expect(
      BetterAuth.to_result({ data: false, error: null }),
    ).resolves.toEqual({ ok: true, data: false });
  });

  it("awaits a promised result", async () => {
    await expect(
      BetterAuth.to_result(Promise.resolve({ data: { id: "x" }, error: null })),
    ).resolves.toEqual({ ok: true, data: { id: "x" } });
  });

  it("keeps the error's status and message", async () => {
    const res = await BetterAuth.to_result({
      data: null,
      error: { status: 403, statusText: "Forbidden", message: "Nope" },
    });

    expect(res).toEqual({
      ok: false,
      error: { status: 403, message: "Nope" },
    });
  });

  it("falls back to the status text, then a generic message", async () => {
    const res = await BetterAuth.to_result({
      data: null,
      error: { status: 0, statusText: "" },
    });

    expect(res).toEqual({
      ok: false,
      error: { status: 500, message: "An unknown error occurred" },
    });
  });
});
