import { CorePool, SmartRouter } from '@plexswap/gateway-guardians'
import { Currency } from '@plexswap/sdk-core'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useRef } from 'react'

import { POOLS_FAST_REVALIDATE } from 'config/pools'
import { coreClients, extendedClients } from 'utils/graphql'
import { getViemClients } from 'utils/viem'

export interface CorePoolsHookParams {
  // Used for caching
  key?: string
  blockNumber?: number
  enabled?: boolean
}

export interface CorePoolsResult {
  pools: CorePool[] | null
  loading: boolean
  syncing: boolean
  blockNumber?: number
  refresh: () => Promise<unknown>
  dataUpdatedAt?: number
}

export function useCoreCandidatePools(
  currencyA?: Currency,
  currencyB?: Currency,
  options?: CorePoolsHookParams,
): CorePoolsResult {
  const refreshInterval = useMemo(() => {
    const chainId = currencyA?.chainId
    if (!chainId) {
      return 0
    }
    return POOLS_FAST_REVALIDATE[chainId] || 0
  }, [currencyA])

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

  const fetchingBlock = useRef<string | undefined>(undefined)
  const queryEnabled = Boolean(options?.enabled && key)

  const result = useQuery({
    queryKey: ['Core_Candidate_Pools', key],

    queryFn: async () => {
      fetchingBlock.current = options?.blockNumber?.toString()
      try {
        const pools = await SmartRouter.getCoreCandidatePools({
          currencyA,
          currencyB,
          coreSubgraphProvider: ({ chainId }) => (chainId ? coreClients[chainId] : undefined),
          extendedSubgraphProvider: ({ chainId }) => (chainId ? extendedClients[chainId] : undefined),
          onChainProvider: getViemClients,
        })
        return {
          pools,
          key,
          blockNumber: options?.blockNumber,
        }
      } finally {
        fetchingBlock.current = undefined
      }
    },

    enabled: Boolean(queryEnabled && key),
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: false,
    retry: 3,
  })

  const { refetch, data, isLoading, isFetching, dataUpdatedAt } = result

  return {
    pools: data?.pools ?? null,
    loading: isLoading,
    syncing: isFetching,
    blockNumber: data?.blockNumber,
    refresh: refetch,
    dataUpdatedAt,
  }
}