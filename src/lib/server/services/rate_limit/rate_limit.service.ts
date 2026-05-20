import { APP } from "$lib/const/app.const";
import { ERROR } from "$lib/const/error.const";
import { redis } from "$lib/server/db/redis.db";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException, metrics } from "@sentry/sveltekit";
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

  constructor(prefix: string, config: RateLimitConfig) {
    const refill_rate = config.refill_rate ?? config.max_tokens;

    this.prefix = prefix;
    this.ratelimit = new Ratelimit({
      redis,
      analytics: true,
      ephemeralCache: false,
      prefix: `${APP.ID}:rate_limit:${prefix}`,

      limiter: Ratelimit.tokenBucket(refill_rate, `${config.refill_interval} s`, config.max_tokens),
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
    tokens: number = 1,
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

      const retry_after_sec = Math.max(0, Math.ceil((res.reset - Date.now()) / 1000));

      return result.suc({
        allowed: false,
        retry_after_sec,
        remaining: res.remaining,
      });
    } catch (error) {
      log.error(error, "consume.error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
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

      const retry_after_sec = Math.max(0, Math.ceil((res.reset - Date.now()) / 1000));

      return result.suc({
        allowed: false,
        retry_after_sec,
        remaining: res.remaining,
      });
    } catch (error) {
      log.error(error, "check.error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Resets the bucket for a specific key
   */
  async reset(key: string): Promise<App.Result<void>> {
    try {
      await this.ratelimit.resetUsedTokens(key);
      return result.suc(undefined);
    } catch (error) {
      log.error(error, "reset.error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
}
