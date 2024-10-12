# ![image](https://user-images.githubusercontent.com/106164850/170870047-1ca9f4ef-7c9a-43d0-a79d-da1b748ed839.png) Plexswap SDK

[![Version](https://img.shields.io/npm/v/@plexswap/sdk-core)](https://www.npmjs.com/package/@plexswap/sdk-core) [![Size](https://img.shields.io/bundlephobia/min/@plexswap/sdk-core)](https://www.npmjs.com/package/@plexswap/sdk-core)

Forked from the [Uniswap SDK](https://github.com/Uniswap/uniswap-v2-sdk/commit/a88048e9c4198a5bdaea00883ca00c8c8e582605).

You can refer to the Uniswap SDK documentation [uniswap.org](https://docs.uniswap.org/sdk/2.0.0/).

## Running tests

To run the tests, follow these steps. You must have at least node v10 and [yarn](https://yarnpkg.com/) installed.

First clone the repository:

```sh
git clone https://github.com/symplexia/Plexswap-SDK.git
```

Move into the plexswap-sdk working directory

```sh
cd plexswap-sdk/
```

Install dependencies

```sh
yarn install
```

Run tests

```sh
yarn test
```

You should see output like the following:

```sh
yarn run v1.22.4
$ tsdx test
 PASS  test/constants.test.ts
 PASS  test/pair.test.ts
 PASS  test/fraction.test.ts
 PASS  test/miscellaneous.test.ts
 PASS  test/entities.test.ts
 PASS  test/trade.test.ts

Test Suites: 1 skipped, 6 passed, 6 of 7 total
Tests:       3 skipped, 82 passed, 85 total
Snapshots:   0 total
Time:        5.091s
Ran all test suites.
✨  Done in 6.61s.
```
