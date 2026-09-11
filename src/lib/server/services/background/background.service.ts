import { Log } from "$lib/utils/logger.util";
import { captureException } from "@sentry/sveltekit";

const log = Log.child({ service: "Background" });

/** Tasks still running. Each removes itself on settle. */
const in_flight = new Set<Promise<void>>();

let draining = false;

/**
 * Soft ceiling only. A backlog is a symptom worth a log line, never a reason to
 * drop work: silently discarding a Cloudinary delete or an R2 audit write is
 * strictly worse than the memory it costs to keep it.
 */
const BACKLOG_WARN_AT = 100;

const DRAIN_TIMEOUT_MS = 10_000;

/** Recognises an `App.Result` without importing the type at runtime. */
const is_result = (value: unknown): value is App.Result<unknown> =>
  typeof value === "object" && value !== null && "ok" in value;

/**
 * Services return `App.Result` rather than throwing, so a failed background
 * task RESOLVES with `{ ok: false }`. Under `waitUntil` that meant every
 * failure of every fire-and-forget call site vanished with no log and no
 * Sentry event — an orphaned Cloudinary asset that nobody ever found out
 * about. Inspect the resolved value, not just the rejection.
 */
const report_result = (value: unknown, scope: string) => {
  const failures = (Array.isArray(value) ? value : [value])
    .filter(is_result)
    .filter((res) => !res.ok);

  for (const failure of failures) {
    log.error({ error: failure.error }, `${scope}.error result`);

    captureException(new Error(`Background task failed: ${scope}`), {
      tags: { background_scope: scope },
      extra: { error: failure.error },
    });
  }
};

/**
 * Fire-and-forget, for a process that outlives the request.
 *
 * A drop-in for `@vercel/functions`' `waitUntil` — same `(promise) => void`
 * shape, which is what `advanced.backgroundTasks.handler` expects — with three
 * things the platform gave us for free and a long-lived server does not:
 *
 * 1. It catches. Better-Auth's background promises can reject, and on a
 *    long-lived process an unhandled rejection terminates the container.
 *    Per-invocation isolation used to absorb that.
 * 2. It inspects `App.Result` failures, which never reject and were therefore
 *    dropped silently by every existing call site.
 * 3. It is tracked, so {@link drain} can wait for it on SIGTERM rather than a
 *    deploy killing half-done work.
 *
 * The task must NOT call `getRequestEvent()`: it runs after the response, with
 * no AsyncLocalStorage context. Read whatever it needs before handing it over.
 */
const run = (task: Promise<unknown>, scope = "task"): void => {
  if (draining) log.warn({ scope }, "background.run.after_shutdown");

  const tracked = task
    .then((value) => report_result(value, scope))
    .catch((error: unknown) => {
      log.error({ err: error }, `${scope}.error unknown`);
      captureException(error, { tags: { background_scope: scope } });
    })
    .finally(() => {
      in_flight.delete(tracked);
    });

  in_flight.add(tracked);

  if (in_flight.size > BACKLOG_WARN_AT) {
    log.warn({ size: in_flight.size, scope }, "background.backlog");
  }
};

/**
 * Wait for outstanding work, bounded.
 *
 * Called from the `sveltekit:shutdown` listener in `hooks.server.ts`, which
 * adapter-node emits from `httpServer.close()`'s CALLBACK — that is, after the
 * last response has gone out, so this runs with no requests in flight.
 *
 * Every tracked promise already carries a `.catch`, so `allSettled` here can
 * never reject; the race is purely a deadline. Tasks started during the drain
 * are not in the snapshot, deliberately — an unbounded chase would never
 * terminate. The residue is logged rather than waited on.
 */
const drain = async (timeout_ms = DRAIN_TIMEOUT_MS): Promise<void> => {
  draining = true;
  if (in_flight.size === 0) return;

  log.info({ size: in_flight.size }, "background.drain.start");

  // `allSettled` consumes the iterable synchronously, so this is already the
  // snapshot we want: tasks started during the drain are not awaited.
  const settled = Promise.allSettled(in_flight).then(() => "drained" as const);

  const deadline = new Promise<"timeout">((resolve) => {
    setTimeout(() => {
      resolve("timeout");
    }, timeout_ms).unref();
  });

  if ((await Promise.race([settled, deadline])) === "timeout") {
    log.error({ size: in_flight.size }, "background.drain.timeout");
  } else {
    log.info("background.drain.done");
  }
};

export const BackgroundService = {
  run,
  drain,
  pending: () => in_flight.size,
};
