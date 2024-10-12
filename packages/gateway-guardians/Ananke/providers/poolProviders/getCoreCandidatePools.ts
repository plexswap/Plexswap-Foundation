import { BigintIsh, Currency, CurrencyAmount, Price, ZERO } from '@plexswap/sdk-core'
import { formatPrice } from '@plexswap/utils/formatFractions'

import { WithFallbackOptions, createAsyncCallWithFallbacks } from '../../../base/utils/withFallback'
import { getPairCombinations } from '../../functions'
import { CorePoolWithTvl, OnChainProvider, SubgraphProvider } from '../../types'
import { getPoolAddress, logger } from '../../utils'
import { CommonTokenPriceProvider, getCommonTokenPrices as defaultGetCommonTokenPrices } from '../getCommonTokenPrices'
import { getCorePoolsOnChain } from './onChainPoolProviders'
import { corePoolTvlSelector } from './poolTvlSelectors'
import { getCorePoolSubgraph } from './subgraphPoolProviders'

export type GetCorePoolsParams = {
  currencyA?: Currency
  currencyB?: Currency
  onChainProvider?: OnChainProvider
  blockNumber?: BigintIsh

  // Only use this param if we want to specify pairs we want to get
  pairs?: [Currency, Currency][]
}

type SubgraphProviders = {
  coreSubgraphProvider?: SubgraphProvider
  extendedSubgraphProvider?: SubgraphProvider
}

type Params = GetCorePoolsParams & SubgraphProviders

export function createCorePoolsProviderByCommonTokenPrices<T = any>(getCommonTokenPrices: CommonTokenPriceProvider<T>) {
  return async function getCorePools({
    currencyA,
    currencyB,
    pairs: providedPairs,
    onChainProvider,
    blockNumber,
    ...rest
  }: GetCorePoolsParams & T) {
    const pairs = providedPairs || getPairCombinations(currencyA, currencyB)
    const [poolsFromOnChain, baseTokenUsdPrices] = await Promise.all([
      getCorePoolsOnChain(pairs, onChainProvider, blockNumber),
      getCommonTokenPrices({ currencyA, currencyB, ...(rest as T) }),
    ])

    if (!poolsFromOnChain) {
      throw new Error('Failed to get v2 candidate pools')
    }

    if (!baseTokenUsdPrices) {
      logger.log('Failed to get base token prices')
      return poolsFromOnChain.map((pool) => {
        return {
          ...pool,
          tvlUSD: BigInt(0),
          address: getPoolAddress(pool),
        }
      })
    }

    return poolsFromOnChain.map<CorePoolWithTvl>((pool) => {
      const getAmountUsd = (amount: CurrencyAmount<Currency>) => {
        if (amount.equalTo(ZERO)) {
          return 0
        }
        const price = baseTokenUsdPrices.get(amount.currency.wrapped.address)
        if (price !== undefined) {
          return parseFloat(amount.toExact()) * price
        }
        const againstAmount = pool.reserve0.currency.equals(amount.currency) ? pool.reserve1 : pool.reserve0
        const againstUsdPrice = baseTokenUsdPrices.get(againstAmount.currency.wrapped.address)
        if (againstUsdPrice) {
          const poolPrice = new Price({ baseAmount: amount, quoteAmount: againstAmount })
          return parseFloat(amount.toExact()) * parseFloat(formatPrice(poolPrice, 6) || '0')
        }
        return 0
      }
      return {
        ...pool,
        tvlUSD: BigInt(Math.floor(getAmountUsd(pool.reserve0) + getAmountUsd(pool.reserve1))),
        address: getPoolAddress(pool),
      }
    })
  }
}

export const getCorePoolsWithTvlByCommonTokenPrices = createCorePoolsProviderByCommonTokenPrices<{
  extendedSubgraphProvider?: SubgraphProvider
}>(defaultGetCommonTokenPrices)

type GetCorePools<T = any> = (params: GetCorePoolsParams & T) => Promise<CorePoolWithTvl[]>

export function createGetCoreCandidatePools<T = any>(
  defaultGetCorePools: GetCorePools<T>,
  options?: WithFallbackOptions<GetCorePools<T>>,
) {
  const getCorePoolsWithFallbacks = createAsyncCallWithFallbacks(defaultGetCorePools, options)

  return async function getCorePools(params: GetCorePoolsParams & T) {
    const { currencyA, currencyB } = params
    const pools = await getCorePoolsWithFallbacks(params)
    return corePoolTvlSelector(currencyA, currencyB, pools)
  }
}

export async function getCoreCandidatePools(params: Params) {
  const fallbacks: GetCorePools[] = [
    ({ pairs: providedPairs, currencyA, currencyB, coreSubgraphProvider }) => {
      const pairs = providedPairs || getPairCombinations(currencyA, currencyB)
      return getCorePoolSubgraph({ provider: coreSubgraphProvider, pairs })
    },
  ]
  const getCorePoolsWithFallbacks = createGetCoreCandidatePools<SubgraphProviders>(getCorePoolsWithTvlByCommonTokenPrices, {
    fallbacks,
    fallbackTimeout: 3000,
  })
  return getCorePoolsWithFallbacks(params)
}
