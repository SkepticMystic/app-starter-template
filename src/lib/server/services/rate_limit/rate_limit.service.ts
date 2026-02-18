import { APP } from "$lib/const/app.const";
import { ERROR } from "$lib/const/error.const";
import { redis } from "$lib/server/db/redis.db";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";

const log = Log.child({ service: "RateLimiter" });

interface RateLimitConfig {
  /**
   * Maximum number of tokens in the bucket
   */
  max_tokens: number;
  /**
   * Number of tokens to refill per interval
   */
  refill_rate: number;
  /**
   * Refill interval in seconds
   */
  refill_interval: number;
}

interface TokenBucket {
  tokens: number;
  last_refill: number;
}

export class RateLimiter {
  private readonly config: RateLimitConfig;
  private readonly prefix: string;

  constructor(prefix: string, config: RateLimitConfig) {
    this.config = config;
    this.prefix = `${APP.ID}:rate_limit:${prefix}`;
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
      const now = Date.now();
      const bucket_key = `${this.prefix}:${key}`;

      // Get current bucket state
      const bucket_data = await redis.get<TokenBucket>(bucket_key);

      let bucket: TokenBucket;
      if (!bucket_data) {
        // Initialize new bucket
        bucket = {
          tokens: this.config.max_tokens,
          last_refill: now,
        };
      } else {
        bucket = bucket_data;
      }

      // Calculate refill
      const time_passed = now - bucket.last_refill;
      const intervals_passed = Math.floor(
        time_passed / (this.config.refill_interval * 1000),
      );

      if (intervals_passed > 0) {
        const tokens_to_add = intervals_passed * this.config.refill_rate;
        bucket.tokens = Math.min(
          this.config.max_tokens,
          bucket.tokens + tokens_to_add,
        );
        bucket.last_refill = now;
      }

      // Check if we can consume
      if (bucket.tokens >= tokens) {
        bucket.tokens -= tokens;

        // Save updated bucket with TTL (2x refill interval to handle edge cases)
        const ttl = this.config.refill_interval * 2;
        await redis.set(bucket_key, bucket, { ex: ttl });

        return result.suc({
          allowed: true,
          remaining: Math.floor(bucket.tokens),
        });
      } else {
        // Calculate retry_after_sec in seconds
        const tokens_needed = tokens - bucket.tokens;
        const intervals_needed = Math.ceil(
          tokens_needed / this.config.refill_rate,
        );
        const retry_after_sec = intervals_needed * this.config.refill_interval;

        // Save current state even though we're rejecting
        const ttl = this.config.refill_interval * 2;
        await redis.set(bucket_key, bucket, { ex: ttl });

        return result.suc({
          allowed: false,
          remaining: Math.floor(bucket.tokens),
          retry_after_sec,
        });
      }
    } catch (error) {
      log.error(error, "consume.error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Gets the current state of the bucket without consuming tokens
   * @param key - Unique identifier
   * @returns Result with current token count
   */
  async check(
    key: string,
  ): Promise<App.Result<{ tokens: number; max_tokens: number }>> {
    try {
      const now = Date.now();
      const bucket_key = `${this.prefix}:${key}`;

      const bucket_data = await redis.get<TokenBucket>(bucket_key);

      if (!bucket_data) {
        return result.suc({
          tokens: this.config.max_tokens,
          max_tokens: this.config.max_tokens,
        });
      }

      // Calculate refill
      const time_passed = now - bucket_data.last_refill;
      const intervals_passed = Math.floor(
        time_passed / (this.config.refill_interval * 1000),
      );

      let tokens = bucket_data.tokens;
      if (intervals_passed > 0) {
        const tokens_to_add = intervals_passed * this.config.refill_rate;
        tokens = Math.min(this.config.max_tokens, tokens + tokens_to_add);
      }

      return result.suc({
        tokens: Math.floor(tokens),
        max_tokens: this.config.max_tokens,
      });
    } catch (error) {
      log.error(error, "consume.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Resets the bucket for a specific key
   * @param key - Unique identifier
   * @returns Result indicating success
   */
  async reset(key: string): Promise<App.Result<void>> {
    try {
      const bucket_key = `${this.prefix}:${key}`;
      await redis.del(bucket_key);
      return result.suc(undefined);
    } catch (error) {
      log.error(error, "reset.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
}
