# with-reliable-cache

```ts
const redisClient = createClient();

const getBalances = (account: string): Promise<number> =>
  new Promise((resolve) =>
    setTimeout(() => {
      console.log('balances query for:', account);
      resolve(420.08);
    }, 3 * 1_000),
  );

const { value, cachedAt } = await withReliableCache(
  `key:${walletAddress}`,
  getBalances(walletAddress),
  {
    storeClient: redisClient,
    ttl: 60 * 1_000,
    // fallbackValue: 0,
    fallbackFunction: () => 0,
    onError: (err) => console.error(err),
  },
);
```
