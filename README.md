<p align="center">
  <a href="https://github.com/invertase/genkit-plugin-redis">
  <img src="https://static.invertase.io/assets/genkit_redis.png" alt="GenkitRedis" width="350" /> <br /><br />
  </a>
  <span>A Redis Plugin for GenKit that adds Redis for efficient state storage, trace storage, caching, and rate limiting.</a>.</span>
</p>

<p align="center">
 <a href="https://invertase.link/discord">
   <img src="https://img.shields.io/discord/295953187817521152.svg?style=flat-square&colorA=7289da&label=Chat%20on%20Discord" alt="Chat on Discord">
 </a>
</p>

<p align="center">
  <a href="https://github.com/invertase/genkit-plugin-redis/blob/main/LICENSE">License</a>
</p>

---

## About

> [!CAUTION]
> Vectors support is still in development (indexer, retriever) and not available here.

This plugin facilitates seamless interaction with Redis in GenKit for storing flow states and traces, managing cached data, and implementing rate limiting mechanisms, enhancing the scalability and performance of applications built with the GenKit AI framework.

```bash
npm install @invertase/genkit-plugin-redis
```

## Examples

See the [examples](https://github.com/invertase/genkit-plugin-redis/tree/main/examples) directory for sample code demonstrating how to use the Redis plugin in a GenKit application.

## API Reference

### `redis`

Initializes the Redis plugin.

```typescript
import { configureGenkit } from "@genkit-ai/core";
import { redis } from "@invertase/genkit-plugin-redis";

configureGenkit({
  plugins: [
    redis({
      // Tell the plugin where to connect, if not provided
      // it defaults to localhost:6379 as below:
      // connectionString: "redis://localhost:6379",

      // Optional
      flowStateStore: {
        // The Redis key to use for storing flow states.
        storageKey: "flowState",
      },

      // Optional
      traceStore: {
        // The Redis key to use for storing trace data.
        storageKey: "trace",
      },
    }),
  ],
  enableTracingAndMetrics: true,
  // Tell GenKit to use the Redis plugin for flow state.
  flowStateStore: "redis",
  // Tell GenKit to use the Redis plugin for trace data.
  traceStore: "redis",
});
```

**Parameters:**

- `params` (optional): `RedisPluginParams` configuration for initializing the Redis client.

**Returns:**

- An object containing:
  - `flowStateStore`: An instance of `RedisFlowStateStore`.
  - `traceStore`: An instance of `RedisTraceStore`.

## Store Operations

### `clearTraceStore`

Clears all entries in the trace store. **Caution:** This will delete all traces from the store.

**Usage:**

```typescript
await clearTraceStore();
```

### `clearFlowStore`

Clears all entries in the flow state store. **Caution:** This will delete all flow states from the store.

**Usage:**

```typescript
await clearFlowStore();
```

## Cache Operations

### `clearCache`

Clears all values from the cache or those matching a specific prefix.

**Parameters:**

- `prefix` (optional): A string prefix to filter which keys to clear from the cache. If not provided, all keys will be deleted.

**Usage:**

```typescript
await clearCache(prefix);
```

### `cacheSet`

Sets a value in the cache.

**Parameters:**

- `key`: The key to set in the cache.
- `value`: The value to set in the cache. If `null`, the key will be deleted from the cache.
- `ttlSeconds` (optional): The time to live for the key in seconds. If not provided, the key will not expire.

**Usage:**

```typescript
await cacheSet(key, value, ttlSeconds);
```

### `cacheGet`

Gets a value from the cache.

**Parameters:**

- `key`: The key to get from the cache.

**Returns:**

- The value from the cache, or `null` if the key does not exist or has expired.

**Usage:**

```typescript
const value = await cacheGet<T>(key);
```

### `cacheFunction`

Caches the result of a function.

**Parameters:**

- `key`: The key to cache the result under.
- `fn`: The callback function to execute and cache the result of.
- `ttlSeconds` (optional): The time to live for the cached result in seconds. If not provided, the result will not expire.

**Returns:**

- The result of the cached function.

**Usage:**

```typescript
const result = await cacheFunction(key, () => myFunction(), ttlSeconds);
```

## Rate Limiting Operations

### `rateLimit`

Checks if a rate limit is exceeded for a given identifier. This counts as a single request for the given identifier.

**Parameters:**

- `identifier`: The identifier to check the rate limit for, e.g., a user ID or a session ID.
- `limit`: The maximum number of requests allowed in a given time period.
- `limitIntervalSeconds`: The time period in seconds for which the limit is applied.

**Returns:**

- `true` if the rate limit is exceeded, `false` otherwise.

**Usage:**

```typescript
const isRateLimited = await rateLimit(identifier, limit, limitIntervalSeconds);
```

### `rateLimitWithStatus`

Checks the rate limit status for a given identifier. This counts as a single request for the given identifier.

**Parameters:**

- `identifier`: The identifier to check the rate limit for, e.g., a user ID or a session ID.
- `limit`: The maximum number of requests allowed in a given time period.
- `limitIntervalSeconds`: The time period in seconds for which the limit is applied.

**Returns:**

- The rate limit status for the identifier.

**Usage:**

```typescript
const status = await rateLimitWithStatus(
  identifier,
  limit,
  limitIntervalSeconds,
);
```

### `resetRateLimit`

Resets the rate limit for a given identifier.

**Parameters:**

- `identifier`: The identifier to reset the rate limit for, e.g., a user ID or a session ID.

**Usage:**

```typescript
await resetRateLimit(identifier);
```

### `clearRateLimits`

Clears all rate limits.

**Usage:**

```typescript
await clearRateLimits();
```

---

<p align="center">
  <a href="https://invertase.io/?utm_source=readme&utm_medium=footer&utm_campaign=dart_custom_lint">
    <img width="75px" src="https://static.invertase.io/assets/invertase/invertase-rounded-avatar.png">
  </a>
  <p align="center">
    Built and maintained by <a href="https://invertase.io/?utm_source=readme&utm_medium=footer&utm_campaign=dart_custom_lint">Invertase</a>.
  </p>
</p>
