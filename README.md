# with-reliable-cache

- Work in progress
- Probably not work
- Not published yet

## In Memory

```ts
const getMemoized = withReliableCache(
  () => {
    console.log('hit');
    return 1;
  },
  { ttl: 60 * 1_000 },
);

getMemoized(); // 1
getMemoized(); // 1
getMemoized(); // 1
getMemoized(); // 1
getMemoized(); // 1
// 'hit'
```

## With Redis

```ts
const redisClient = createClient();

// fetcher likely to fail
const getBalances = (account: string): Promise<number> => {
  ...
}

const getSafeBalances = withReliableCache(
  `balances:${walletAddress}`,
  getBalances(walletAddress),
  {
    storeClient: redisClient,
    ttl: 60 * 1_000,
    initialFallback: 0,
    // fallback: 0,
    onError: (err) => console.error(err),
  },
);

await getSafeBalances('0x000'); // 0 (fetcher error, using initial fallback)
await getSafeBalances('0x000'); // 420.08 (no cached ttl -> updated)
await getSafeBalances('0x000'); // 420.08 (cached ttl alive, using cached)
await getSafeBalances('0x000'); // 420.08 (cached ttl dead but fetcher error, using cached)
await getSafeBalances('0x000'); // 520.22 (cached ttl dead -> updated)
```
