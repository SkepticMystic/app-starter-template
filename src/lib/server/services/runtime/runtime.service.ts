import { Log } from "#lib/utils/logger.util.js";
import { captureException } from "@sentry/sveltekit";
import { AdapterService } from "../adapter/adapter.service";

const log = Log.child({ service: "Runtime" });

/**
 * In-process background work, and the shutdown drain that keeps a graceful
 * stop from losing it. A crash still loses it: anything that must survive one
 * needs a queue, not this.
 *
 * Both targets go through the same two calls. On Vercel, `defer` hands each
 * task to the platform's `waitUntil` (via {@link AdapterService.wait_until})
 * so the function is not frozen before it settles, and nothing ever calls
 * `drain`. On a Node server there is no platform to hand it to, so the task is
 * tracked here instead, and `drain` — run on `sveltekit:shutdown` from
 * `instrumentation.server.ts` — waits for it before the process exits. Without
 * that, a container SIGTERM would drop whatever the last requests started:
 * Better-Auth's verification and reset emails among them.
 */

/**
 * The drain's budget. Better-Auth's emails are bounded by nothing else in our
 * code, so for them this is the only bound. A container's stop grace period
 * must exceed adapter-node's `SHUTDOWN_TIMEOUT` plus this.
 */
const DRAIN_TIMEOUT_MS = 30_000;

/** Per process: what {@link drain} must empty before exit. */
const outstanding = new Set<Promise<unknown>>();

/** A synchronous throw from `work` becomes a rejection, so it is supervised too. */
const start = async (work: () => Promise<unknown>) => await work();

/**
 * Runs `work` now, without awaiting it; a rejection is logged and captured,
 * never rethrown.
 *
 * Supervision is load-bearing on Node: an unhandled rejection under the
 * default `--unhandled-rejections=throw` takes the whole server down.
 * Better-Auth's `backgroundTasks` handler receives a raw, uncaught promise, so
 * that path depends on it too.
 *
 * Takes a thunk rather than a started promise so a throw before the first
 * `await` is caught as well. An already-started promise is passed as
 * `() => promise`.
 */
const defer = (work: () => Promise<unknown>): void => {
  const supervised = start(work)
    .catch((error: unknown) => {
      log.error(error, "defer.error unknown");

      captureException(error);
    })
    .finally(() => {
      outstanding.delete(supervised);
    });

  outstanding.add(supervised);
  AdapterService.wait_until(supervised);
};

/**
 * Waits for deferred work to settle, up to `timeout_ms`. Called on
 * `sveltekit:shutdown`, after the server has closed its connections, to save
 * what the last requests started.
 *
 * The set is re-read each round, because `Promise.allSettled` snapshots its
 * input and a closing request can still {@link defer} after the snapshot.
 * Work lost to the deadline is logged at `error`.
 */
const drain = async (timeout_ms: number = DRAIN_TIMEOUT_MS) => {
  const started = Date.now();
  const initial = outstanding.size;

  if (!initial) return { initial, lost: 0, ms: 0 };

  log.info({ outstanding: initial }, "drain.start");

  const rounds = async (): Promise<void> => {
    if (!outstanding.size) return;

    await Promise.allSettled(outstanding);

    return rounds();
  };

  let timer: ReturnType<typeof setTimeout> | undefined;

  const deadline = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeout_ms);
  });

  try {
    await Promise.race([rounds(), deadline]);
  } finally {
    // An uncleared timer would keep a drained process alive for the whole budget.
    clearTimeout(timer);
  }

  const result = { initial, lost: outstanding.size, ms: Date.now() - started };

  if (result.lost) {
    log.error(result, "drain.timeout deferred_work_lost");
  } else {
    log.info(result, "drain.done");
  }

  return result;
};

export const RuntimeService = {
  defer,
  drain,

  outstanding_count: () => outstanding.size,
};
