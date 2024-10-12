import { ExtendedPool, SmartRouter } from '@plexswap/gateway-guardians/Ananke'
import { AetherRouter } from '@plexswap/gateway-guardians'
import { Currency } from '@plexswap/sdk-core'
import { Tick } from '@plexswap/sdk-extended'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { POOLS_FAST_REVALIDATE, POOLS_SLOW_REVALIDATE } from 'config/pools'
import { tracker } from 'utils/datadog'
import { extendedClients } from 'utils/graphql'
import { createViemPublicClientGetter, getViemClients } from 'utils/viem'

import { getPoolTicks } from './extended/useAllExtendedTicksQuery'
import { useMulticallGasLimit } from './useMulticallGasLimit'

export interface ExtendedPoolsHookParams {
  // Used for caching
  key?: string
  blockNumber?: number
  enabled?: boolean
}

export interface ExtendedPoolsResult {
  refresh: () => Promise<unknown>
  pools: ExtendedPool[] | undefined
  loading: boolean
  syncing: boolean
  blockNumber?: number
  error: Error | null
  dataUpdatedAt?: number
}

export function useExtendedCandidatePools(
  currencyA?: Currency,
  currencyB?: Currency,
  options?: ExtendedPoolsHookParams,
): ExtendedPoolsResult {
  const {
    pools: candidatePoolsWithoutTicks,
    loading: isLoading,
    syncing: isValidating,
    key,
    blockNumber,
    refresh,
    error,
  } = useExtendedCandidatePoolsWithoutTicks(currencyA, currencyB, options)

  const {
    data,
    isLoading: ticksLoading,
    isFetching: ticksValidating,
  } = useExtendedPoolsWithTicks(candidatePoolsWithoutTicks, {
    key,
    blockNumber,
    enabled: options?.enabled,
  })

  const candidatePools = data?.pools

  return {
    refresh,
    error,
    pools: candidatePools,
    loading: isLoading || ticksLoading,
    syncing: isValidating || ticksValidating,
    blockNumber: data?.blockNumber,
  }
}

export function useExtendedCandidatePoolsWithoutTicks(
  currencyA?: Currency,
  currencyB?: Currency,
  options?: ExtendedPoolsHookParams,
) {
  const key = useMemo(() => {
    if (
      !currencyA ||
      !currencyB ||
      currencyA.chainId !== currencyB.chainId ||
      currencyA.wrapped.equals(currencyB.wrapped)
    ) {
      return ''
    }
    const symbols = currencyA.wrapped.sortsBefore(currencyB.wrapped)
      ? [currencyA.symbol, currencyB.symbol]
      : [currencyB.symbol, currencyA.symbol]
    return [...symbols, currencyA.chainId].join('_')
  }, [currencyA, currencyB])

  const refetchInterval = useMemo(() => {
    if (!currencyA?.chainId) {
      return 0
    }
    return POOLS_FAST_REVALIDATE[currencyA.chainId] || 0
  }, [currencyA?.chainId])

  const { data, refetch, isPending, isFetching, error } = useQuery({
    queryKey: ['extended_candidate_pools', key],
    queryFn: async () => {
      const pools = await SmartRouter.getExtendedCandidatePools({
        currencyA,
        currencyB,
        subgraphProvider: ({ chainId }) => (chainId ? extendedClients[chainId] : undefined),
        onChainProvider: getViemClients,
        blockNumber: options?.blockNumber,
      })
      return {
        key,
        pools,
        blockNumber: options?.blockNumber,
      }
    },
    retry: 2,
    staleTime: refetchInterval,
    refetchInterval,
    refetchOnWindowFocus: false,
    enabled: Boolean(currencyA && currencyB && key && options?.enabled),
  })

  return {
    refresh: refetch,
    pools: data?.pools,
    loading: isPending,
    syncing: isFetching,
    blockNumber: data?.blockNumber,
    key: data?.key,
    error,
  }
}

export function useExtendedPoolsWithTicksOnChain(
  currencyA?: Currency,
  currencyB?: Currency,
  options?: ExtendedPoolsHookParams,
): ExtendedPoolsResult {
  const gasLimit = useMulticallGasLimit(currencyA?.chainId)
  const key = useMemo(() => {
    if (
      !currencyA ||
      !currencyB ||
      currencyA.chainId !== currencyB.chainId ||
      currencyA.wrapped.equals(currencyB.wrapped)
    ) {
      return ''
    }
    const symbols = currencyA.wrapped.sortsBefore(currencyB.wrapped)
      ? [currencyA.symbol, currencyB.symbol]
      : [currencyB.symbol, currencyA.symbol]
    return [currencyA.chainId, ...symbols, currencyA.chainId].join('_')
  }, [currencyA, currencyB])

  const refreshInterval = useMemo(() => {
    const chainId = currencyA?.chainId
    if (!chainId) {
      return 0
    }
    return POOLS_FAST_REVALIDATE[chainId] || 0
  }, [currencyA])

  const { refetch, error, data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['extended_pools_with_ticks_on_chain', key],
    queryFn: async ({ signal }) => {
      const clientProvider = createViemPublicClientGetter({ transportSignal: signal })
      try {
        const startTime = performance.now()
        const label = `[EXTENDED_POOLS_WITH_TICKS_ON_CHAIN] chain ${currencyA?.chainId} ${currencyA?.symbol} - ${currencyB?.symbol}. (multicall gas limit: ${gasLimit})`
        const res = await AetherRouter.getExtendedCandidatePools({
          currencyA,
          currencyB,
          clientProvider,
          gasLimit,
        })
        const duration = Math.floor(performance.now() - startTime)
        tracker.log(`[PERF] ${label} duration:${duration}ms`, {
          chainId: currencyA?.chainId,
          label: key,
          duration,
        })
        return res
      } catch (e) {
        console.error(e)
        throw e
      }
    },
    enabled: Boolean(key && options?.enabled && gasLimit),
    refetchInterval: refreshInterval,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
  })

  return {
    refresh: refetch,
    error,
    pools: data,
    loading: isLoading,
    syncing: isFetching,
    dataUpdatedAt,
  }
}

export function useExtendedPoolsWithTicks(
  pools: ExtendedPool[] | null | undefined,
  { key, blockNumber, enabled = true }: ExtendedPoolsHookParams = {},
) {
  const refreshInterval = useMemo(() => {
    const chainId = pools?.[0]?.token0?.chainId
    if (!chainId) {
      return 0
    }
    return POOLS_SLOW_REVALIDATE[chainId] || 0
  }, [pools])

  const poolsWithTicks = useQuery({
    queryKey: ['extended_pool_ticks', key],

    queryFn: async () => {
      if (!pools) {
        throw new Error('Invalid pools to get ticks')
      }
      const label = `[EXTENDED_POOL_TICKS] ${key} ${blockNumber?.toString()}`
      SmartRouter.logger.metric(label)
      const poolTicks = await Promise.all(
        pools.map(async (pool) => {
          const { token0 } = pool
          return getPoolTicks(token0.chainId, SmartRouter.getPoolAddress(pool)).then((data) => {
            return data.map(
              ({ tick, liquidityNet, liquidityGross }) =>
                new Tick({ index: Number(tick), liquidityNet, liquidityGross }),
            )
          })
        }),
      )
      SmartRouter.logger.metric(label, poolTicks)
      return {
        pools: pools?.map((pool, i) => ({
          ...pool,
          ticks: poolTicks[i],
        })),
        key,
        blockNumber,
      }
    },

    enabled: Boolean(key && pools && enabled),
    refetchInterval: refreshInterval,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
  })

  return poolsWithTicks
}
