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

getMemoized();
getMemoized();
getMemoized();
getMemoized();
getMemoized();
// 'hit'
```

## With Redis

```ts
const redisClient = createClient();

// fetcher likely to fail
const getBalances = (account: string): Promise<number> =>
  new Promise((resolve) =>
    setTimeout(() => {
      console.log('hit', account);
      resolve(420.08);
    }, 3 * 1_000),
  );

const getSafeBalances = withReliableCache(
  `balances:${walletAddress}`,
  getBalances(walletAddress),
  {
    storeClient: redisClient,
    ttl: 60 * 1_000,
    // fallbackValue: 0,
    fallbackFunction: () => 0,
    onError: (err) => console.error(err),
  },
);

await getSafeBalances('0x000');
```
