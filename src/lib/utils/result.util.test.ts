import { ERROR } from "#lib/const/error.const.js";
import { isHttpError } from "@sveltejs/kit";
import { describe, expect, it } from "vite-plus/test";
import { raise, result } from "./result.util.js";

describe("raise", () => {
  it("throws kit's own error with the App.Error's status and body", () => {
    const thrown = (() => {
      try {
        raise({ ...ERROR.NOT_FOUND, message: "No such task" });
      } catch (error) {
        return error;
      }
    })();

    expect(isHttpError(thrown, 404)).toBe(true);
    expect(thrown).toMatchObject({
      body: { code: "NOT_FOUND", message: "No such task" },
    });
  });

  it("narrows a refused result, so the success branch type-checks", () => {
    const res = result.suc(1) as App.Result<number>;
    if (!res.ok) raise(res.error);

    // Without the explicit `never`, `res.data` here is a type error.
    expect(res.data).toBe(1);
  });
});
