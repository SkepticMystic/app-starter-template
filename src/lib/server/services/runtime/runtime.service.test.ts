import { RuntimeService } from "#lib/server/services/runtime/runtime.service.js";
import { captureException } from "@sentry/sveltekit";
import { waitUntil } from "@vercel/functions";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

/**
 * Real timers and small budgets. `outstanding` is module-level, so every test must leave the
 * set empty — the hung-task test releases its promise, and `afterEach` drains.
 */

const tick = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** A timer fires on libuv's cached loop time, up to 1ms before `Date.now()` agrees. */
const TIMER_SLACK_MS = 1;

const deferred = () => {
  let release!: () => void;

  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });

  return { promise, release };
};

afterEach(async () => {
  await RuntimeService.drain(1_000);
});

describe("RuntimeService.defer", () => {
  it("supervises a thunk that throws before its first await", async () => {
    RuntimeService.defer(() => {
      throw new Error("sync boom");
    });

    await RuntimeService.drain(1_000);

    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "sync boom" }),
    );
  });

  // On Vercel this is what keeps the function from freezing mid-task.
  it("hands the supervised task to the host, which never sees a rejection", async () => {
    RuntimeService.defer(async () => await Promise.reject(new Error("boom")));

    expect(waitUntil).toHaveBeenCalledOnce();
    await expect(
      vi.mocked(waitUntil).mock.calls[0]?.[0],
    ).resolves.toBeUndefined();
  });

  it("tracks work until it settles, then forgets it", async () => {
    RuntimeService.defer(async () => await tick(20));

    expect(RuntimeService.outstanding_count()).toBe(1);

    await RuntimeService.drain(1_000);

    expect(RuntimeService.outstanding_count()).toBe(0);
  });

  it("swallows a rejection and still counts as drained", async () => {
    RuntimeService.defer(async () => await Promise.reject(new Error("boom")));

    const result = await RuntimeService.drain(1_000);

    expect(result.lost).toBe(0);
    expect(captureException).toHaveBeenCalledOnce();
  });
});

describe("RuntimeService.drain", () => {
  it("returns immediately when nothing is outstanding", async () => {
    const result = await RuntimeService.drain(1_000);

    expect(result).toEqual({ initial: 0, lost: 0, ms: 0 });
  });

  it("waits for every outstanding task", async () => {
    const settled: number[] = [];

    const record = async (ms: number) => {
      await tick(ms);

      settled.push(ms);
    };

    for (const ms of [5, 15, 30]) {
      RuntimeService.defer(async () => await record(ms));
    }

    const result = await RuntimeService.drain(1_000);

    expect(result.initial).toBe(3);
    expect(result.lost).toBe(0);
    expect(settled).toHaveLength(3);
  });

  // A single `allSettled` pass would miss a task registered after its snapshot.
  it("picks up work registered while it is already draining", async () => {
    let late_settled = false;

    const late = async () => {
      await tick(10);

      late_settled = true;
    };

    const register_late = async () => {
      await tick(10);

      RuntimeService.defer(late);
    };

    RuntimeService.defer(register_late);

    const result = await RuntimeService.drain(1_000);

    expect(late_settled).toBe(true);
    expect(result.lost).toBe(0);
  });

  it("gives up at the timeout and reports what it lost", async () => {
    const budget = 20;

    const hung = deferred();

    RuntimeService.defer(async () => await hung.promise);

    const result = await RuntimeService.drain(budget);

    // `lost` proves it waited; `ms` rules out a deadline that resolved at once.
    expect(result.lost).toBe(1);
    expect(result.ms).toBeGreaterThanOrEqual(budget - TIMER_SLACK_MS);

    hung.release();
  });
});
