import { describe, expect, it, vi } from "vite-plus/test";
import { run_chunked } from "./chunked.util";

describe("run_chunked", () => {
  it("runs `concurrency` at a time, and settles every item", async () => {
    let running = 0;
    let peak = 0;

    const res = await run_chunked({
      items: [1, 2, 3, 4, 5],
      concurrency: 2,
      deadline: Date.now() + 60_000,
      handler: async (n) => {
        running += 1;
        peak = Math.max(peak, running);
        await Promise.resolve();
        running -= 1;

        if (n === 3) throw new Error("three");
        return n * 10;
      },
    });

    expect(peak).toBe(2);
    expect(res.map((r) => r.item)).toEqual([1, 2, 3, 4, 5]);
    expect(res[0]?.outcome).toEqual({ status: "fulfilled", value: 10 });
    expect(res[2]?.outcome.status).toBe("rejected");
  });

  it("starts no chunk past the deadline, but finishes the one under way", async () => {
    vi.useFakeTimers();

    try {
      const deadline = Date.now() + 1_000;

      const res = await run_chunked({
        items: [1, 2, 3, 4],
        concurrency: 2,
        deadline,
        handler: async (n) => {
          vi.setSystemTime(deadline);
          return n;
        },
      });

      expect(res.map((r) => r.item)).toEqual([1, 2]);
    } finally {
      vi.useRealTimers();
    }
  });
});
