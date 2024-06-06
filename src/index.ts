import { genkitPlugin, Plugin } from "@genkit-ai/core";
import { RedisFlowStateStore, RedisTraceStore } from "./store";
import { initializeRedisClient, RedisPluginParams } from "./client";
import * as clientInternals from "./client";

/**
 * Initializes the Redis plugin for GenKit.
 *
 * This plugin providers stores for flow states and traces, as well
 * as APIs for caching and rate limiting.
 */
export const redis: Plugin<[RedisPluginParams] | []> = genkitPlugin(
  "redis",
  async function (params?: RedisPluginParams) {
    await initializeRedisClient(params);
    return {
      flowStateStore: {
        id: "redis",
        value: new RedisFlowStateStore({
          ...params?.flowStateStore,
        }),
      },
      traceStore: {
        id: "redis",
        value: new RedisTraceStore({
          ...params?.traceStore,
        }),
      },
    };
  },
);

/**
 * Clears the flow state store.
 * Caution: This will delete all flow states from the store.
 */
export async function clearTraceStore() {
  await clientInternals.clearTraceStore();
}

/**
 * Clears the trace store.
 * Caution: This will delete all traces from the store.
 */
export async function clearFlowStore() {
  await clientInternals.clearFlowStore();
}

/**
 * Clears the cache.
 * Caution: This will delete all values from the cache.
 * @param prefix The keys matching this prefix to clear from the cache. If not provided, all keys will be deleted.
 */
export async function clearCache(prefix?: string) {
  await clientInternals.clearCache(prefix);
}

/**
 * Sets a value in the cache.
 *
 * @param key The key to set in the cache
 * @param value The value to set in the cache. If null, the key will be deleted from the cache.
 * @param ttlSeconds The time to live for the key in seconds. If not provided, the key will not expire.
 */
export async function cacheSet(
  key: string,
  value: any | null,
  ttlSeconds?: number,
) {
  await clientInternals.cacheSet(key, value, ttlSeconds);
}

/**
 * Gets a value from the cache.
 *
 * @param key The key to get from the cache
 * @returns The value from the cache, or null if the key does not exist or has expired.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  return clientInternals.cacheGet(key);
}

/**
 * Caches the result of a function.
 *
 * @param key The key to cache the result under.
 * @param fn The callback that executes the function to cache the result of.
 * @param ttlSeconds The time to live for the cached result in seconds. If not provided, the result will not expire.
 * @returns The result of the cached function.
 */
export async function cacheFunction<T extends () => any>(
  key: string,
  fn: T,
  ttlSeconds?: number,
): Promise<ReturnType<T>> {
  const value = await cacheGet<ReturnType<T>>(key);
  if (value !== null) {
    return value;
  }
  const result = await fn();
  await cacheSet(key, result, ttlSeconds);
  return result;
}

/**
 * Checks if a rate limit is exceeded for a given identifier. This counts as a single request for the given identifier.
 *
 * @param identifier The identifier to check the rate limit for, e.g. a user ID or a session ID.
 * @param limit The maximum number of requests allowed in a given time period.
 * @param limitIntervalSeconds The time period in seconds for which the limit is applied.
 * @returns True if the rate limit is exceeded, false otherwise.
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  limitIntervalSeconds: number,
): Promise<boolean> {
  const status = await clientInternals.rateLimitWithStatus(
    identifier,
    limit,
    limitIntervalSeconds,
  );
  return status.shouldBlock;
}

/**
 * Checks the rate limit status for a given identifier. This counts as a single request for the given identifier.
 *
 * @param identifier The identifier to check the rate limit for, e.g. a user ID or a session ID.
 * @param limit The maximum number of requests allowed in a given time period.
 * @param limitIntervalSeconds The time period in seconds for which the limit is applied.
 * @returns The rate limit status for the identifier.
 */
export async function rateLimitWithStatus(
  identifier: string,
  limit: number,
  limitIntervalSeconds: number,
): Promise<clientInternals.RateLimitStatus> {
  return clientInternals.rateLimitWithStatus(
    identifier,
    limit,
    limitIntervalSeconds,
  );
}

/**
 * Resets the rate limit for a given identifier.
 *
 * @param identifier The identifier to reset the rate limit for, e.g. a user ID or a session ID.
 */
export async function resetRateLimit(identifier: string) {
  await clientInternals.resetRateLimit(identifier);
}

/**
 * Clears all rate limits.
 */
export async function clearRateLimits() {
  await clientInternals.clearRateLimits();
}
