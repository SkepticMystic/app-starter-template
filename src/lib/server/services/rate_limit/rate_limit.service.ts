import { ERROR } from "$lib/const/error.const";
import { ServiceUtil } from "$lib/server/services/service.util";
import { REDIS_PREFIX, redis } from "$lib/server/db/redis.db";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { metrics } from "@sentry/sveltekit";
import { Ratelimit } from "@upstash/ratelimit";
import { AdapterService } from "../adapter/adapter.service";

const log = Log.child({ service: "RateLimiter" });

interface RateLimitConfig {
  /**
   * Maximum number of tokens in the bucket
   */
  max_tokens: number;
  /**
   * Number of tokens to refill per interval. Defaults to max_tokens.
   */
  refill_rate?: number;
  /**
   * Refill interval in seconds
   */
  refill_interval: number;
}

export class RateLimiter {
  private readonly prefix: string;
  private readonly ratelimit: InstanceType<typeof Ratelimit>;

  /**
   * Identifiers Redis has already refused, with the reset timestamp it gave.
   * Held here rather than left to the map Upstash would create on its own, so
   * that {@link reset} can clear it.
   */
  private readonly cache = new Map<string, number>();

  constructor(prefix: string, config: RateLimitConfig) {
    const refill_rate = config.refill_rate ?? config.max_tokens;

    this.prefix = prefix;
    this.ratelimit = new Ratelimit({
      redis,
      analytics: true,

      /**
       * `false` was the right serverless answer: there was no process memory
       * to share, so the map could only ever be a per-invocation liability.
       * On a long-lived server every limiter is a module-scope singleton and
       * the map lives for the life of the process.
       *
       * What it changes: an identifier Redis has ALREADY refused is refused
       * again from memory, with no round trip, until its reset time. It can
       * never allow more than Redis would — nothing is cached until Redis
       * itself has said no — so the only effect is that abusive traffic, the
       * traffic you most want to shed, stops costing an Upstash command each.
       * With more than one replica the cache is per-replica and therefore
       * less effective, never wrong.
       */
      ephemeralCache: this.cache,
      prefix: `${REDIS_PREFIX}:rate_limit:${prefix}`,

      limiter: Ratelimit.tokenBucket(
        refill_rate,
        `${config.refill_interval} s`,
        config.max_tokens,
      ),
    });
  }

  /**
   * Attempts to consume tokens from the bucket
   * @param key - Unique identifier (e.g., user_id, ip_address, org_id)
   * @param tokens - Number of tokens to consume (default: 1)
   * @returns Result with boolean indicating if tokens were consumed
   */
  async consume(
    key: string,
    tokens = 1,
  ): Promise<
    App.Result<{
      allowed: boolean;
      remaining: number;
      retry_after_sec?: number;
    }>
  > {
    try {
      const geo = AdapterService.get_geo();
      const ip = AdapterService.get_ip() ?? undefined;
      const user_agent = AdapterService.get_user_agent() ?? undefined;

      const res = await this.ratelimit.limit(key, {
        ip,
        geo,
        rate: tokens,
        userAgent: user_agent,
      });

      if (res.success) {
        return result.suc({
          allowed: true,
          remaining: res.remaining,
        });
      }

      metrics.count("rate_limit_blocked", 1, {
        attributes: {
          ip,
          geo,
          user_agent,
          key,
          prefix: this.prefix,
        },
      });

      const retry_after_sec = Math.max(
        0,
        Math.ceil((res.reset - Date.now()) / 1000),
      );

      return result.suc({
        allowed: false,
        retry_after_sec,
        remaining: res.remaining,
      });
    } catch (error) {
      return ServiceUtil.internal(error, { log, scope: "consume" });
    }
  }

  /**
   * Turns a `{ allowed }` report into the refusal a caller can return directly.
   *
   * A 429 that does not say when to come back invites an immediate retry, so
   * the wait is always appended.
   */
  private decide(
    res: { allowed: boolean; retry_after_sec?: number },
    message?: string,
  ): App.Result<void> {
    if (res.allowed) return result.suc(undefined);

    return result.err({
      ...ERROR.TOO_MANY_REQUESTS,
      message: `${message ?? "Too many requests."} Try again in ${res.retry_after_sec ?? 60}s.`,
    });
  }

  /**
   * Consume-or-refuse, in one call.
   *
   * Folds the two-step `if (!rate.ok) return rate; if (!rate.data.allowed) …`
   * that every call site was writing into a single guard, so a refusal and a
   * Redis fault leave by the same door and neither can be forgotten. Failing
   * closed on a fault is the point: an outage must not silently remove the
   * limit.
   */
  async enforce(
    key: string,
    opts: { tokens?: number; message?: string } = {},
  ): Promise<App.Result<void>> {
    const res = await this.consume(key, opts.tokens ?? 1);
    if (!res.ok) return res;

    return this.decide(res.data, opts.message);
  }

  /**
   * The same refusal without spending a token.
   *
   * For budgets charged on an *outcome* rather than on the attempt — the
   * sign-in failure bucket, where every caller is checked but only a wrong
   * password pays. Advisory, not a mutex: two attempts racing on one remaining
   * token both pass.
   */
  async precheck(
    key: string,
    opts: { tokens?: number; message?: string } = {},
  ): Promise<App.Result<void>> {
    const res = await this.check(key, opts.tokens ?? 1);
    if (!res.ok) return res;

    return this.decide(res.data, opts.message);
  }

  /**
   * Returns whether the bucket has at least `tokens` available, without
   * consuming them.
   */
  async check(
    key: string,
    tokens = 1,
  ): Promise<
    App.Result<{
      allowed: boolean;
      remaining: number;
      retry_after_sec?: number;
    }>
  > {
    try {
      const res = await this.ratelimit.getRemaining(key);
      const allowed = res.remaining >= tokens;

      if (allowed) {
        return result.suc({
          allowed: true,
          remaining: res.remaining - tokens,
        });
      }

      const retry_after_sec = Math.max(
        0,
        Math.ceil((res.reset - Date.now()) / 1000),
      );

      return result.suc({
        allowed: false,
        retry_after_sec,
        remaining: res.remaining,
      });
    } catch (error) {
      return ServiceUtil.internal(error, { log, scope: "check" });
    }
  }

  /**
   * Resets the bucket for a specific key
   */
  async reset(key: string): Promise<App.Result<void>> {
    try {
      /**
       * The local cache has to go too. `resetUsedTokens` clears Redis, but a
       * key blocked in memory would stay blocked in THIS process until its
       * original reset time — a support unblock that appears not to work.
       */
      this.cache.delete(key);

      await this.ratelimit.resetUsedTokens(key);
      return result.suc(undefined);
    } catch (error) {
      return ServiceUtil.internal(error, { log, scope: "reset" });
    }
  }
}
