import { TIME } from "#lib/const/time.const.js";

/**
 * One timer behind every relative timestamp on the page, rather than a `setInterval` per
 * `<Time>` on tables of hundreds of rows. Each subscriber names its own cadence and is called
 * only when due; all labels share one "now".
 */

type Tick = () => void;

type Subscription = {
  period: number;
  /** The next `Date.now()` at which it is called. */
  due: number;
};

const subscriptions = new Map<Tick, Subscription>();

let timer: ReturnType<typeof setTimeout> | undefined;

/** How often a label about `gap_ms` away needs redrawing, driven by the unit it is shown in. */
const period_for = (gap_ms: number) => {
  const gap = Math.abs(gap_ms);

  if (gap < TIME.MIN) return 5_000;
  if (gap < TIME.HOUR) return 30_000;
  if (gap < TIME.DAY) return 5 * TIME.MIN;

  return TIME.HOUR;
};

const schedule = () => {
  if (timer !== undefined) {
    clearTimeout(timer);
    timer = undefined;
  }

  if (subscriptions.size === 0) return;

  let earliest = Number.POSITIVE_INFINITY;
  for (const { due } of subscriptions.values()) {
    if (due < earliest) earliest = due;
  }

  // Via `setTimeout` even when already due, so `run` is never re-entered synchronously.
  timer = setTimeout(run, Math.max(earliest - Date.now(), 0));
};

const run = () => {
  timer = undefined;

  const now = Date.now();

  // Collected before calling: a tick can mount or destroy a `<Time>`, mutating the map.
  const due: Tick[] = [];

  for (const [tick, subscription] of subscriptions) {
    if (subscription.due > now) continue;

    subscription.due = now + subscription.period;
    due.push(tick);
  }

  // An earlier tick may have unsubscribed a later one.
  for (const tick of due) {
    if (subscriptions.has(tick)) tick();
  }

  schedule();
};

/** Background tabs throttle timers, so everything is due the moment the tab is visible again. */
const on_visibility = () => {
  if (document.visibilityState !== "visible") return;

  for (const subscription of subscriptions.values()) subscription.due = 0;

  schedule();
};

/**
 * Call `tick` at or after every `period` ms until the returned function is called — meant
 * to be returned straight out of an `$effect`.
 */
const subscribe = (period: number, tick: Tick) => {
  if (subscriptions.size === 0) {
    globalThis.document?.addEventListener("visibilitychange", on_visibility);
  }

  subscriptions.set(tick, { period, due: Date.now() + period });
  schedule();

  return () => {
    subscriptions.delete(tick);

    if (subscriptions.size === 0) {
      globalThis.document?.removeEventListener(
        "visibilitychange",
        on_visibility,
      );
    }

    schedule();
  };
};

export const Clock = {
  period_for,
  subscribe,
};
