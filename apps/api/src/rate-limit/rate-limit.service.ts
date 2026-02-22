import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

export type RateLimitDecision = {
  allowed: boolean;
  currentCount: number;
  resetAtMs: number;
};

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly redis: Redis | null;
  private readonly redisKeyPrefix = process.env.RATE_LIMIT_KEY_PREFIX?.trim() || 'vendorapp';
  private readonly memoryWindow = new Map<string, { count: number; resetAtMs: number }>();

  constructor() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
    const isProduction = process.env.NODE_ENV === 'production';
    const requireDistributedRateLimit =
      process.env.REQUIRE_DISTRIBUTED_RATE_LIMIT?.trim() === 'true' || isProduction;

    if ((redisUrl && !redisToken) || (!redisUrl && redisToken)) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must both be set');
    }
    if (requireDistributedRateLimit && !redisUrl) {
      throw new Error(
        'Distributed rate limiting is required. Configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN',
      );
    }

    if (redisUrl && redisToken) {
      this.redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });
    } else {
      this.redis = null;
    }
  }

  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitDecision> {
    if (this.redis) {
      try {
        return await this.consumeRedis(key, limit, windowSeconds);
      } catch (error) {
        this.logger.warn(
          `Redis rate-limit fallback to memory for key=${key}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return this.consumeMemory(key, limit, windowSeconds);
  }

  private async consumeRedis(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitDecision> {
    const redisKey = `${this.redisKeyPrefix}:ratelimit:${key}`;
    const currentCount = await this.redis!.incr(redisKey);
    if (currentCount === 1) {
      await this.redis!.expire(redisKey, windowSeconds);
    }
    const ttlSeconds = await this.redis!.ttl(redisKey);
    const resetAtMs =
      ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : Date.now() + windowSeconds * 1000;
    return {
      allowed: currentCount <= limit,
      currentCount,
      resetAtMs,
    };
  }

  private consumeMemory(key: string, limit: number, windowSeconds: number): RateLimitDecision {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const existing = this.memoryWindow.get(key);

    if (!existing || existing.resetAtMs <= now) {
      const next = { count: 1, resetAtMs: now + windowMs };
      this.memoryWindow.set(key, next);
      this.cleanupMemory(now);
      return { allowed: true, currentCount: 1, resetAtMs: next.resetAtMs };
    }

    existing.count += 1;
    this.memoryWindow.set(key, existing);
    return {
      allowed: existing.count <= limit,
      currentCount: existing.count,
      resetAtMs: existing.resetAtMs,
    };
  }

  private cleanupMemory(now: number): void {
    if (this.memoryWindow.size < 2000) return;
    for (const [key, value] of this.memoryWindow.entries()) {
      if (value.resetAtMs <= now) {
        this.memoryWindow.delete(key);
      }
    }
  }
}
