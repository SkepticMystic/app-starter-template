import { result } from "#lib/utils/result.util.js";

/**
 * Remembers a successful answer per key for `ttl_ms`, in this process — for a figure read far
 * more often than it needs to be fresh. Nothing invalidates an entry before it lapses but
 * `clear`, and a failure is never remembered. Callers asking for a key while it loads share that
 * one load. Each machine keeps its own.
 *
 * An expired entry is dropped when its key is next read, and all of them once the map reaches
 * `max_entries` — the oldest written too, if every one is still fresh — so a long-lived process
 * does not keep a key it stopped asking about.
 */
export const ttl_memo = <V>(input: {
  ttl_ms: number;
  max_entries?: number;
}) => {
  const entries = new Map<string, { at: number; value: V }>();
  const pending = new Map<string, Promise<App.Result<V>>>();
  const max_entries = input.max_entries ?? 1_000;

  const make_room = (now: number) => {
    for (const [key, entry] of entries) {
      if (now - entry.at >= input.ttl_ms) entries.delete(key);
    }

    if (entries.size >= max_entries) {
      const oldest = entries.keys().next().value;

      if (oldest !== undefined) entries.delete(oldest);
    }
  };

  const load_into = async (
    key: string,
    load: () => Promise<App.Result<V>>,
    now: number,
  ): Promise<App.Result<V>> => {
    const res = await load();

    // Re-inserted, so insertion order is write order and the first key is the oldest.
    entries.delete(key);

    if (res.ok) {
      if (entries.size >= max_entries) make_room(now);

      entries.set(key, { at: now, value: res.data });
    }

    return res;
  };

  return {
    get: async (
      key: string,
      load: () => Promise<App.Result<V>>,
    ): Promise<App.Result<V>> => {
      const now = Date.now();
      const hit = entries.get(key);

      if (hit && now - hit.at < input.ttl_ms) {
        return result.suc(hit.value);
      }

      let inflight = pending.get(key);

      if (!inflight) {
        const started = load_into(key, load, now).finally(() => {
          if (pending.get(key) === started) pending.delete(key);
        });

        pending.set(key, started);
        inflight = started;
      }

      return await inflight;
    },

    /** After a write that makes what is remembered wrong, and between tests. */
    clear: () => {
      entries.clear();
      pending.clear();
    },
  };
};
