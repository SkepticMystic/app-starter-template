import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { TIME } from "#lib/const/time.const.js";
import { Clock } from "./clock.util";

describe("Clock", () => {
  describe("period_for", () => {
    it("redraws a stamp inside the minute every few seconds", () => {
      expect(Clock.period_for(-30 * 1_000)).toBe(5_000);
    });

    it("follows the unit, not the sign — a due time reads the same as a past one", () => {
      expect(Clock.period_for(30 * 1_000)).toBe(Clock.period_for(-30 * 1_000));
    });

    it("slows to the minute boundary within the hour", () => {
      expect(Clock.period_for(-20 * TIME.MIN)).toBe(30_000);
    });

    it("slows again within the day", () => {
      expect(Clock.period_for(-5 * TIME.HOUR)).toBe(5 * TIME.MIN);
    });

    it("bottoms out hourly, where the label stops moving", () => {
      expect(Clock.period_for(-3 * TIME.WEEK)).toBe(TIME.HOUR);
      expect(Clock.period_for(-10 * TIME.YEAR)).toBe(TIME.HOUR);
    });
  });

  describe("subscribe", () => {
    /**
     * `Clock` keeps its subscriptions and its timer at module scope, shared by every file on the
     * worker, so each one a test opens is closed here rather than at the end of its body — where
     * a failed assertion would skip it and leave a subscriber and a fake timer id behind for
     * whatever runs next. Unsubscribing twice is harmless.
     */
    const opened: (() => void)[] = [];

    const subscribe = (period: number, tick: () => void) => {
      const stop = Clock.subscribe(period, tick);
      opened.push(stop);

      return stop;
    };

    beforeEach(() => vi.useFakeTimers());

    afterEach(() => {
      for (const stop of opened.splice(0)) stop();

      vi.useRealTimers();
    });

    it("calls back on its own period, repeatedly", () => {
      const tick = vi.fn();
      subscribe(1_000, tick);

      vi.advanceTimersByTime(999);
      expect(tick).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(tick).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(3_000);
      expect(tick).toHaveBeenCalledTimes(4);
    });

    it("stops on unsubscribe, and leaves no timer behind", () => {
      const tick = vi.fn();
      const stop = subscribe(1_000, tick);

      vi.advanceTimersByTime(1_000);
      expect(tick).toHaveBeenCalledTimes(1);

      stop();

      expect(vi.getTimerCount()).toBe(0);

      vi.advanceTimersByTime(10_000);
      expect(tick).toHaveBeenCalledTimes(1);
    });

    it("does not wake a slow subscriber on a fast one's tick", () => {
      const fast = vi.fn();
      const slow = vi.fn();

      subscribe(1_000, fast);
      subscribe(60_000, slow);

      vi.advanceTimersByTime(5_000);
      expect(fast).toHaveBeenCalledTimes(5);
      expect(slow).not.toHaveBeenCalled();

      vi.advanceTimersByTime(55_000);
      expect(slow).toHaveBeenCalledTimes(1);
    });

    it("shares one timer between subscribers", () => {
      subscribe(1_000, vi.fn());
      subscribe(2_000, vi.fn());
      subscribe(3_000, vi.fn());

      expect(vi.getTimerCount()).toBe(1);
    });

    it("keeps ticking for the others when one unsubscribes", () => {
      const staying = vi.fn();
      const leaving = vi.fn();

      subscribe(1_000, staying);
      const stop_leaving = subscribe(1_000, leaving);

      vi.advanceTimersByTime(1_000);
      stop_leaving();

      vi.advanceTimersByTime(2_000);
      expect(staying).toHaveBeenCalledTimes(3);
      expect(leaving).toHaveBeenCalledTimes(1);
    });

    it("survives a subscriber that unsubscribes another mid-tick", () => {
      const other = vi.fn();
      let stop_other: (() => void) | undefined;

      subscribe(1_000, () => stop_other?.());
      stop_other = subscribe(1_000, other);

      vi.advanceTimersByTime(1_000);

      // The loop iterates a copy, so it must re-check membership.
      expect(other).not.toHaveBeenCalled();
    });
  });
});
