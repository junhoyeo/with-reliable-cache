import CompressedJSON from 'compressed-json';

type StoreClient = {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
};

type CacheVO<T extends any> = {
  t: number;
  v: T;
};
const getCached = async <T extends any>(
  key: string,
  storeClient: StoreClient,
) => {
  const cachedRawValue = await storeClient.get(key);
  return !cachedRawValue
    ? null
    : CompressedJSON.decompress.fromString<T>(cachedRawValue);
};

type Options<T extends any> = {
  storeClient: StoreClient;

  // cache time
  ttl?: number;

  fallbackValue?: T;
  fallbackFunction?: (() => T) | (() => Promise<T>);
  onError?: (err: Error) => void;
};

export const withReliableCache = async <T extends any>(
  key: string,
  asyncOperation: Promise<T> | (() => Promise<T>),
  {
    storeClient,
    ttl = 3_000,
    fallbackValue,
    fallbackFunction,
    onError,
  }: Options<T>,
) => {
  let value: T | null = null;
  let cachedAt: number | null = 0;

  const cached = await getCached<CacheVO<T>>(key, storeClient);
  if (cached && cached.t >= Date.now() - ttl) {
    // Use cached value if not expired
    value = cached.v;
    cachedAt = cached.t;
  } else {
    try {
      value = await (asyncOperation instanceof Promise
        ? asyncOperation
        : asyncOperation());
      cachedAt = new Date().getTime();
      await storeClient.set(
        key,
        CompressedJSON.compress.toString<CacheVO<T>>({
          v: value,
          t: cachedAt,
        }),
      );
    } catch (err) {
      onError?.(err);
      if (!!cached) {
        // Use cached value if available
        value = cached.v;
        cachedAt = cached.t;
      } else {
        if (!!fallbackFunction) {
          value = await fallbackFunction();
        } else {
          value = fallbackValue || null;
        }
        cachedAt = null;
      }
    }
  }

  return { value, cachedAt };
};
