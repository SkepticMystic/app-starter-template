import { result } from "#lib/utils/result.util.js";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { ttl_memo } from "./ttl_memo.util";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ttl_memo", () => {
  it("answers a repeat read of a key from memory until the TTL lapses", async () => {
    const memo = ttl_memo<number>({ ttl_ms: 15_000 });
    const load = vi.fn(async () => result.suc(1));

    await memo.get("a", load);
    vi.advanceTimersByTime(14_999);
    const second = await memo.get("a", load);

    expect(second).toEqual(result.suc(1));
    expect(load).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await memo.get("a", load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("keeps keys apart", async () => {
    const memo = ttl_memo<string>({ ttl_ms: 15_000 });

    await memo.get("a", async () => result.suc("first"));
    const other = await memo.get("b", async () => result.suc("second"));

    expect(other).toEqual(result.suc("second"));
  });

  // A failed read must not stand in for the figure until the TTL lapses.
  it("does not remember a failure", async () => {
    const memo = ttl_memo<number>({ ttl_ms: 15_000 });
    const failure = result.err({ status: 500, message: "boom" });

    const first = await memo.get("a", async () => failure);
    const second = await memo.get("a", async () => result.suc(2));

    expect(first).toEqual(failure);
    expect(second).toEqual(result.suc(2));
  });

  it("drops expired keys once it is full, so a long-lived process does not grow without bound", async () => {
    const memo = ttl_memo<number>({ ttl_ms: 1_000, max_entries: 2 });
    const load = vi.fn(async () => result.suc(1));

    await memo.get("a", load);
    await memo.get("b", load);
    vi.advanceTimersByTime(1_000);
    await memo.get("c", load);

    // "a" lapsed and was pruned, so it loads again rather than serving a stale value.
    await memo.get("a", load);

    expect(load).toHaveBeenCalledTimes(4);
  });

  it("drops the oldest key when it is full of fresh ones", async () => {
    const memo = ttl_memo<number>({ ttl_ms: 15_000, max_entries: 2 });
    const load = vi.fn(async () => result.suc(1));

    await memo.get("a", load);
    await memo.get("b", load);
    await memo.get("c", load);
    await memo.get("b", load);
    await memo.get("a", load);

    expect(load).toHaveBeenCalledTimes(4);
  });

  it("shares one load between callers asking while it runs", async () => {
    const memo = ttl_memo<number>({ ttl_ms: 15_000 });
    const load = vi.fn(async () => result.suc(1));

    const [first, second] = await Promise.all([
      memo.get("a", load),
      memo.get("a", load),
    ]);

    expect([first, second]).toEqual([result.suc(1), result.suc(1)]);
    expect(load).toHaveBeenCalledOnce();
  });

  it("forgets everything on clear", async () => {
    const memo = ttl_memo<number>({ ttl_ms: 15_000 });
    const load = vi.fn(async () => result.suc(1));

    await memo.get("a", load);
    memo.clear();
    await memo.get("a", load);

    expect(load).toHaveBeenCalledTimes(2);
  });
});
