import { ChainId } from '@plexswap/chains'
import { BigintIsh, Currency } from '@plexswap/sdk-core'
import memoize from 'lodash/memoize.js'
import { Address } from 'viem'

import { WithFallbackOptions, createAsyncCallWithFallbacks } from '../../utils/withFallback'
import { getPairCombinations } from '../../functions'
import { ExtendedPoolWithTvl, OnChainProvider, SubgraphProvider } from '../../types'
import { getExtendedPoolsWithoutTicksOnChain } from './onChainPoolProviders'
import { extendedPoolTvlSelector } from './poolTvlSelectors'
import { getExtendedPoolSubgraph } from './subgraphPoolProviders'

// @deprecated
export type { GetExtendedPoolsParams as GetExtendedCandidatePoolsParams }

export type GetExtendedPoolsParams = {
  currencyA?: Currency
  currencyB?: Currency

  // Extended subgraph provider
  subgraphProvider?: SubgraphProvider
  onChainProvider?: OnChainProvider
  blockNumber?: BigintIsh

  // Only use this param if we want to specify pairs we want to get
  pairs?: [Currency, Currency][]
}

type DefaultParams = GetExtendedPoolsParams & {
  // In millisecond
  fallbackTimeout?: number
  subgraphFallback?: boolean
  staticFallback?: boolean
}

export interface ExtendedPoolTvlReference extends Pick<ExtendedPoolWithTvl, 'address'> {
  tvlUSD: bigint | string
}

const getExtendedPoolTvl = memoize(
  (pools: ExtendedPoolTvlReference[], poolAddress: Address) => {
    const poolWithTvl = pools.find((p) => p.address === poolAddress)
    return poolWithTvl?.tvlUSD || 0n
  },
  (_, poolAddress) => poolAddress,
)

// Get pools from onchain and use the tvl data from subgraph as reference
// The reason we do this is the data from subgraph might delay
export const extendedPoolsOnChainProviderFactory = <P extends GetExtendedPoolsParams = GetExtendedPoolsParams>(
  tvlReferenceProvider: (params: P) => Promise<ExtendedPoolTvlReference[]>,
) => {
  return async function getExtendedPoolsWithTvlFromOnChain(params: P): Promise<ExtendedPoolWithTvl[]> {
    const { currencyA, currencyB, pairs: providedPairs, onChainProvider, blockNumber } = params
    const pairs = providedPairs || getPairCombinations(currencyA, currencyB)

    const [fromOnChain, tvlReference] = await Promise.allSettled([
      getExtendedPoolsWithoutTicksOnChain(pairs, onChainProvider, blockNumber),
      tvlReferenceProvider(params),
    ])

    if (fromOnChain.status === 'fulfilled' && tvlReference.status === 'fulfilled') {
      const { value: poolsFromOnChain } = fromOnChain
      const { value: poolTvlReferences } = tvlReference
      if (!Array.isArray(poolTvlReferences)) {
        throw new Error('Failed to get tvl references')
      }
      return poolsFromOnChain.map((pool) => {
        const tvlUSD = BigInt(getExtendedPoolTvl(poolTvlReferences, pool.address))
        return {
          ...pool,
          tvlUSD,
        }
      })
    }
    throw new Error(`Getting extended pools failed. Onchain ${fromOnChain.status}, tvl references ${tvlReference.status}`)
  }
}

export const getExtendedPoolsWithTvlFromOnChain = extendedPoolsOnChainProviderFactory((params: GetExtendedPoolsParams) => {
  const { currencyA, currencyB, pairs: providedPairs, subgraphProvider } = params
  const pairs = providedPairs || getPairCombinations(currencyA, currencyB)
  return getExtendedPoolSubgraph({ provider: subgraphProvider, pairs })
})

const createFallbackTvlRefGetter = () => {
  const cache = new Map<ChainId, ExtendedPoolTvlReference[]>()
  return async (params: GetExtendedPoolsParams) => {
    const { currencyA } = params
    if (!currencyA?.chainId) {
      throw new Error(`Cannot get tvl references at chain ${currencyA?.chainId}`)
    }
    const cached = cache.get(currencyA.chainId)
    if (cached) {
      return cached
    }
    // LOOKUP //
    const res = await fetch(`https://pools-api.plexfinance.us/v0/extended-pools-tvl/${currencyA.chainId}`)
    const refs: ExtendedPoolTvlReference[] = await res.json()
    cache.set(currencyA.chainId, refs)
    return refs
  }
}

export const getExtendedPoolsWithTvlFromOnChainFallback = extendedPoolsOnChainProviderFactory(createFallbackTvlRefGetter())

export const getExtendedPoolsWithTvlFromOnChainStaticFallback = extendedPoolsOnChainProviderFactory<
  Omit<GetExtendedPoolsParams, 'subgraphProvider' | 'onChainProvider'>
>(() => Promise.resolve([]))

type GetExtendedPools<T = any> = (params: GetExtendedPoolsParams & T) => Promise<ExtendedPoolWithTvl[]>

// @deprecated
export { createGetExtendedCandidatePools as createGetExtendedCandidatePoolsWithFallbacks }

export function createGetExtendedCandidatePools<T = any>(
  defaultGetExtendedPools: GetExtendedPools<T>,
  options?: WithFallbackOptions<GetExtendedPools<T>>,
) {
  const getExtendedPoolsWithFallbacks = createAsyncCallWithFallbacks(defaultGetExtendedPools, options)

  return async function getExtendedPools(params: GetExtendedPoolsParams & T) {
    const { currencyA, currencyB } = params
    const pools = await getExtendedPoolsWithFallbacks(params)
    return extendedPoolTvlSelector(currencyA, currencyB, pools)
  }
}

export async function getExtendedCandidatePools(params: DefaultParams) {
  const { subgraphFallback = true, staticFallback = true, fallbackTimeout, ...rest } = params

  const fallbacks: GetExtendedPools[] = []

  if (subgraphFallback) {
    // Fallback to get pools from on chain and ref tvl by subgraph
    fallbacks.push(getExtendedPoolsWithTvlFromOnChain)

    // Fallback to get all pools info from subgraph
    fallbacks.push(async (p) => {
      const { currencyA, currencyB, pairs: providedPairs, subgraphProvider } = p
      const pairs = providedPairs || getPairCombinations(currencyA, currencyB)
      return getExtendedPoolSubgraph({ provider: subgraphProvider, pairs })
    })
  }

  // Fallback to get pools from on chain and static ref
  if (staticFallback) {
    fallbacks.push(getExtendedPoolsWithTvlFromOnChainStaticFallback)
  }

  // Deafult try get pools from on chain and ref tvl by subgraph cache
  const getExtendedPoolsWithFallback = createGetExtendedCandidatePools(getExtendedPoolsWithTvlFromOnChainFallback, {
    fallbacks,
    fallbackTimeout,
  })
  return getExtendedPoolsWithFallback(rest)
}
