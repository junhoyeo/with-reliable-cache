import CompressedJSON from 'compressed-json';
import { createClient } from 'redis';

type RedisClient = ReturnType<typeof createClient>;

type CacheVO<T extends any> = {
  t: number;
  v: T;
};
const getCached = async <T extends any>(
  __key: string,
  __redisClient: RedisClient,
) => {
  const cachedRawValue = await __redisClient.get(__key);
  if (!cachedRawValue) {
    return null;
  }
  return CompressedJSON.decompress.fromString<T>(cachedRawValue);
};

export const withRedisCache = async <T extends any>(
  key: string,
  asyncOperation: () => Promise<T>,
  redisClient: RedisClient,
  cacheTime: number,
  fallbackValue?: T,
  fallbackFunction?: () => Promise<T>,
) => {
  let value: T | null = null;
  let cachedAt: number | null = 0;

  const cached = await getCached<CacheVO<T>>(key, redisClient);
  if (cached && cached.t >= Date.now() - cacheTime) {
    // Use cached value if not expired
    value = cached.v;
    cachedAt = cached.t;
  } else {
    try {
      value = await asyncOperation();
      cachedAt = new Date().getTime();
      await redisClient.set(
        key,
        CompressedJSON.compress.toString<CacheVO<T>>({
          v: value,
          t: cachedAt,
        }),
      );
    } catch (err) {
      console.error(err);

      if (!cached) {
        if (fallbackFunction) {
          value = await fallbackFunction();
        } else {
          value = fallbackValue || null;
        }
        cachedAt = null;
      } else {
        // Use cached value if available
        value = cached.v;
        cachedAt = cached.t;
      }
    }
  }

  return { value, cachedAt };
};
