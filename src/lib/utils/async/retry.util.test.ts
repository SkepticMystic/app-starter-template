import { describe, expect, it, vi } from "vite-plus/test";
import { retry } from "./retry.util.js";

const no_sleep = vi.fn(async (_ms: number) => {});

const opts = {
  attempts: 3,
  should_retry: (outcome: PromiseSettledResult<string>) =>
    outcome.status === "rejected" || outcome.value === "busy",
  delay_ms: (attempt: number) => attempt * 1000,
};

describe("retry", () => {
  it("answers the first success without retrying", async () => {
    const run = vi.fn(async () => "ok");

    const res = await retry(run, { ...opts, sleep: no_sleep });

    expect(res).toEqual({
      outcome: { status: "fulfilled", value: "ok" },
      attempts: 1,
    });
    expect(no_sleep).not.toHaveBeenCalled();
  });

  it("retries a retryable outcome until one succeeds, backing off between", async () => {
    const run = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("busy")
      .mockRejectedValueOnce(new Error("socket hang up"))
      .mockResolvedValueOnce("ok");
    const sleep = vi.fn(async (_ms: number) => {});

    const res = await retry(run, { ...opts, sleep });

    expect(res).toEqual({
      outcome: { status: "fulfilled", value: "ok" },
      attempts: 3,
    });
    expect(sleep.mock.calls).toEqual([[1000], [2000]]);
  });

  it("stops at an outcome should_retry refuses", async () => {
    const run = vi.fn(async () => "invalid");

    const res = await retry(run, { ...opts, sleep: no_sleep });

    expect(res.attempts).toBe(1);
    expect(res.outcome).toEqual({ status: "fulfilled", value: "invalid" });
  });

  it("gives up after the last attempt and answers its outcome, not a throw", async () => {
    const error = new Error("down");
    const run = vi.fn(async () => {
      throw error;
    });
    const on_retry = vi.fn();

    const res = await retry(run, { ...opts, on_retry, sleep: no_sleep });

    expect(res).toEqual({
      outcome: { status: "rejected", reason: error },
      attempts: 3,
    });
    expect(run).toHaveBeenCalledTimes(3);
    expect(on_retry.mock.calls.map(([, attempt]) => attempt)).toEqual([1, 2]);
  });
});
