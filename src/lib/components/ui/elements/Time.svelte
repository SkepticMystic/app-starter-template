<script lang="ts">
  import { TIME } from "#lib/const/time.const.js";
  import { Clock } from "#lib/utils/clock.util.js";
  import { EMPTY, Format } from "#lib/utils/format.util.js";
  import { Guard } from "#lib/utils/guard.util.js";
  import type { ClassValue } from "svelte/elements";

  /** Everything a timestamp arrives as: a `Date` from Drizzle, an ISO string from JSON, epoch ms. */
  type Input = Date | string | number | undefined | null;

  /**
   * How far from now a stamp may be before `auto` stops reading it as a gap.
   *
   * A day, because that is where relative stops answering the question it is good at. Inside
   * it, "20 minutes ago" answers "is this current?" better than any clock time. Past it,
   * "3 weeks ago" is strictly less useful than the date it is hiding.
   */
  const AUTO_WITHIN = TIME.DAY;

  type Show =
    | "date"
    | "datetime"
    | "relative"
    /** Relative inside {@link AUTO_WITHIN}, absolute beyond it. */
    | "auto"
    | ((date: Date) => string);

  let {
    date,
    title,
    opts,
    live,
    fallback = EMPTY,
    show = "date",
    class: klass = "",
  }: {
    date: Input;

    show?: Show;

    /**
     * Passed to the underlying `Intl` date formatter — `{ timeStyle: "medium" }` for a
     * timeline that needs seconds, `{ month: "short", day: "numeric" }` for a tight column.
     *
     * Ignored by `relative`, and by `auto` while it is rendering the relative half.
     */
    opts?: Intl.DateTimeFormatOptions;

    /**
     * Override the tooltip. The default is the full absolute stamp, which is the one thing a
     * reader of a relative label cannot recover — drop it only for something *more* specific.
     */
    title?: string;

    /** Shown in place of the stamp when `date` is missing or unparseable. */
    fallback?: string;

    /**
     * Re-render on a shared clock so the label cannot go stale.
     *
     * Defaults to on exactly when the label is a function of now, which is the only case
     * where it changes anything — set it explicitly for a `show` function that reads the
     * clock itself, or to hold a label still.
     */
    live?: boolean;

    class?: ClassValue;
  } = $props();

  const resolved = $derived.by(() => {
    if (Guard.is_nullish(date)) return null;

    const dt = new Date(date);

    /* `new Date("last tuesday")` doesn't throw, it returns an `Invalid Date` — an object, and
     * so truthy. Unguarded it reached `toISOString()` below, which throws `RangeError` and
     * takes the whole page's render down over one bad timestamp. */
    return Number.isNaN(dt.getTime()) ? null : dt;
  });

  /** The formats that are a function of now, and so the ones that go stale on screen. */
  const clock_bound = $derived(show === "relative" || show === "auto");

  const ticking = $derived(live ?? clock_bound);

  /** The instant every label here is measured against — shared, so two stamps rendered a
   * second apart cannot disagree about when "now" was. */
  let now = $state(Date.now());

  $effect(() => {
    if (!ticking || !resolved) return;

    /* Reading `now` is what re-runs this as the clock advances, and that is deliberate: the
     * cadence has to follow the gap, so a stamp seconds old redraws every few seconds and,
     * once it is a day old, hourly. */
    const period = Clock.period_for(resolved.getTime() - now);

    return Clock.subscribe(period, () => {
      now = Date.now();
    });
  });

  const label = $derived.by(() => {
    if (!resolved) return fallback;

    if (typeof show === "function") return show(resolved);

    switch (show) {
      case "relative": {
        return Format.relative(resolved, undefined, now);
      }

      case "auto": {
        return Math.abs(resolved.getTime() - now) < AUTO_WITHIN
          ? Format.relative(resolved, undefined, now)
          : Format.datetime(resolved, opts);
      }

      default: {
        return Format[show](resolved, opts);
      }
    }
  });

  /**
   * The absolute stamp, always within reach.
   *
   * To the second and with the zone, because a relative label throws exactly that away and it
   * is the precision every question asked about one needs — "the call at 14:03:45 SAST", not
   * "the call about two hours ago". `Format.relative`'s own docstring asks that a relative
   * stamp never travel alone; this is how it doesn't have to.
   */
  const stamp = $derived(
    resolved
      ? Format.datetime(resolved, { dateStyle: "full", timeStyle: "long" })
      : undefined,
  );
</script>

{#if resolved}
  <time
    class={klass}
    datetime={resolved.toISOString()}
    title={title ?? stamp}
  >
    {label}
  </time>
{:else}
  <!-- A `<time>` with no parseable `datetime` is invalid, so an absent date is not one. -->
  <span
    {title}
    class={klass}
  >
    {label}
  </span>
{/if}
