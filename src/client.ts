import { Redis, RedisOptions } from "ioredis";

declare module "ioredis" {
  interface RedisCommander {
    genkitPluginRedisStorageLoad(
      storageKey: string,
      flowId: string,
    ): Promise<string | null>;
    genkitPluginRedisStorageSave(
      storageKey: string,
      flowId: string,
      flowStateJsonString: string,
    ): Promise<void>;
    genkitPluginRedisStorageList(
      storageKey: string,
      limit?: string,
      cursor?: string,
    ): Promise<[[string, string], string]>;
    genkitPluginRedisDeleteByPrefix(prefix: string): Promise<void>;
    genkitPluginRedisThrottle(
      key: string,
      limit: number,
      limitIntervalSeconds: number,
    ): Promise<[number, number, number]>;
  }
}

export interface RedisPluginParams {
  connectionString?: string;
  flowStateStore?: {
    storageKey?: string;
  };
  traceStore?: {
    storageKey?: string;
  };
}

let redisClient: Redis | null = null;

const redisInternalConfig: RedisOptions = {
  keyPrefix: "_genkit_plugin_redis_:",
  lazyConnect: true,
  scripts: {
    genkitPluginRedisStorageLoad: {
      lua: `
          local storageKey = KEYS[1]
          local flowId = ARGV[1]
          return redis.call("HGET", storageKey, flowId)
        `,
      numberOfKeys: 1,
    },
    genkitPluginRedisStorageSave: {
      lua: `
          local storageKey = KEYS[1]
          local flowId = ARGV[1]
          local flowStateJsonString = ARGV[2]
          redis.call("HSET", storageKey, flowId, flowStateJsonString)
        `,
      numberOfKeys: 1,
    },
    genkitPluginRedisStorageList: {
      lua: `
          local storageKey = KEYS[1]
          local flowStates = {}
          local limit = toNumber(ARGV[1] or 0)
          local cursor = tonumber(ARGV[2] or 0)
          if limit == 0 then
            limit = 1000
            while cursor ~= 0 do
              local result = redis.call("HSCAN", storageKey, cursor, 'LIMIT', limit)
              cursor = result[1]
              flowStates = table.concat(flowStates, result[2])
            end
          else
            local result = redis.call("HSCAN", storageKey, cursor, 'LIMIT', limit)
            cursor = result[1]
            flowStates = table.concat(flowStates, result[2])
          end
          return {flowStates, tostring(cursor)}
        `,
      numberOfKeys: 1,
    },
    genkitPluginRedisDeleteByPrefix: {
      lua: `
        local cursor = 0
        local deletedKeys = 0
        repeat
            local result = redis.call('SCAN', cursor, 'MATCH', ARGV[1])
            for _,key in ipairs(result[2]) do
                redis.call('UNLINK', key)
                deletedKeys = deletedKeys + 1
            end
            cursor = tonumber(result[1])
        until cursor == 0
        return deletedKeys
        `,
      numberOfKeys: 0,
    },
    genkitPluginRedisThrottle: {
      lua: `
        local count = redis.call('INCR', KEYS[1])
        local ttl = redis.call('ttl', KEYS[1])
        local limit = tonumber(ARGV[1])
        local remaining = limit - count
        
        -- Set expiry if new key or existing ttl is -1
        if count == 1 or ttl == -1 then
          redis.call('EXPIRE', KEYS[1], ARGV[2])
        end
        
        if ttl == -1 then
          ttl = tonumber(ARGV[2])
        end
        
        if count > tonumber(ARGV[1]) then
          return {1, 0, ttl}
        end
        
        if remaining == 0 and count > 1 then
          return {1, 0, ttl}
        end
        
        return {0, remaining, ttl}
      `,
      numberOfKeys: 1,
    },
  },
};

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error("The Redis genkit plugin has not been initialized.");
  }
  return redisClient;
}

export async function initializeRedisClient(params?: RedisPluginParams) {
  redisClient = new Redis(
    params?.connectionString || "redis://localhost:6379",
    redisInternalConfig,
  );
  await redisClient.connect();
}

export async function clearFlowStore() {
  await getRedisClient().genkitPluginRedisDeleteByPrefix(
    `${redisInternalConfig.keyPrefix!}:flow_storage:*`,
  );
}

export async function clearTraceStore() {
  await getRedisClient().genkitPluginRedisDeleteByPrefix(
    `${redisInternalConfig.keyPrefix!}:trace_storage:*`,
  );
}

export async function clearCache(prefix?: string) {
  if (prefix) {
    await getRedisClient().genkitPluginRedisDeleteByPrefix(
      `${redisInternalConfig.keyPrefix!}:cache:${prefix}*`,
    );
  } else {
    await getRedisClient().genkitPluginRedisDeleteByPrefix(
      `${redisInternalConfig.keyPrefix!}:cache:*`,
    );
  }
}

export async function cacheSet(
  key: string,
  value: any | null,
  ttlSeconds: number = 60,
) {
  const _key = `:cache:${key}`;
  if (value === null) {
    await getRedisClient().unlink(_key);
    return;
  }
  if (ttlSeconds === undefined) {
    await getRedisClient().set(_key, JSON.stringify(value));
  } else {
    await getRedisClient().set(_key, JSON.stringify(value), "EX", ttlSeconds);
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const _key = `cache:${key}`;
  const value = await getRedisClient().get(_key);
  if (value === null) {
    return null;
  }
  return JSON.parse(value);
}

export interface RateLimitStatus {
  shouldBlock: boolean;
  remainingCount: number;
  resetsInSeconds: number;
}

export async function rateLimitWithStatus(
  identifier: string,
  limit: number,
  limitIntervalSeconds: number,
): Promise<RateLimitStatus> {
  const key = `rate_limit:${identifier}`;
  const [shouldBlock, remainingCount, resetsInSeconds] =
    await getRedisClient().genkitPluginRedisThrottle(
      key,
      limit,
      limitIntervalSeconds,
    );
  return {
    shouldBlock: shouldBlock === 1,
    remainingCount,
    resetsInSeconds,
  };
}

export async function resetRateLimit(identifier: string) {
  const key = `rate_limit:${identifier}`;
  await getRedisClient().unlink(key);
}

export async function clearRateLimits() {
  await getRedisClient().genkitPluginRedisDeleteByPrefix(
    `${redisInternalConfig.keyPrefix!}:rate_limit:*`,
  );
}

export type { Redis } from "ioredis";
