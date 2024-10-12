/* eslint-disable @typescript-eslint/no-shadow, no-await-in-loop, no-constant-condition, no-console */
import { Currency } from '@plexswap/sdk-core'
import { Pool } from '@plexswap/gateway-guardians'
import { useCallback, useMemo } from 'react'

import { useCoreCandidatePools } from './useCorePools'
import {
    ExtendedPoolsHookParams,
    ExtendedPoolsResult,
    useExtendedCandidatePools,
    useExtendedCandidatePoolsWithoutTicks,
    useExtendedPoolsWithTicksOnChain,
} from './useExtendedPools'
import { useStableCandidatePools } from './usePoolsOnChain'

interface FactoryOptions {
  // use to identify hook
  key: string

  useExtendedPools: (currencyA?: Currency, currencyB?: Currency, params?: ExtendedPoolsHookParams) => ExtendedPoolsResult
}

export interface PoolsWithState {
  refresh: () => Promise<unknown>
  pools: Pool[] | undefined
  loading: boolean
  syncing: boolean
  blockNumber?: number
  dataUpdatedAt?: number
}

export interface CommonPoolsParams {
  blockNumber?: number
  allowInconsistentBlock?: boolean
  enabled?: boolean
}

function commonPoolsHookCreator({ useExtendedPools }: FactoryOptions) {
  return function useCommonPools(
    currencyA?: Currency,
    currencyB?: Currency,
    { blockNumber, allowInconsistentBlock = false, enabled = true }: CommonPoolsParams = {},
  ): PoolsWithState {
    const {
      pools: extendedPools,
      loading: extendedLoading,
      syncing: extendedSyncing,
      blockNumber: extendedBlockNumber,
      refresh: extendedRefresh,
      dataUpdatedAt: extendedPoolsUpdatedAt,
    } = useExtendedPools(currencyA, currencyB, { blockNumber, enabled })
    const {
      pools: corePools,
      loading: coreLoading,
      syncing: coreSyncing,
      blockNumber: coreBlockNumber,
      refresh: coreRefresh,
      dataUpdatedAt: corePoolsUpdatedAt,
    } = useCoreCandidatePools(currencyA, currencyB, { blockNumber, enabled })
    const {
      pools: stablePools,
      loading: stableLoading,
      syncing: stableSyncing,
      blockNumber: stableBlockNumber,
      refresh: stableRefresh,
      dataUpdatedAt: stablePoolsUpdatedAt,
    } = useStableCandidatePools(currencyA, currencyB, { blockNumber, enabled })

    const consistentBlockNumber = useMemo(
      () =>
        coreBlockNumber &&
        stableBlockNumber &&
        extendedBlockNumber &&
        coreBlockNumber === stableBlockNumber &&
        stableBlockNumber === extendedBlockNumber
          ? coreBlockNumber
          : undefined,
      [coreBlockNumber, extendedBlockNumber, stableBlockNumber],
    )
    // FIXME: allow inconsistent block not working as expected
    const poolsData: [Pool[], number] | undefined = useMemo(
      () =>
        (!coreLoading || corePools) &&
        (!extendedLoading || extendedPools) &&
        (!stableLoading || stablePools) &&
        (allowInconsistentBlock || !!consistentBlockNumber)
          ? [
              [...(corePools || []), ...(extendedPools || []), ...(stablePools || [])],
              Math.max(corePoolsUpdatedAt || 0, Math.max(extendedPoolsUpdatedAt || 0, stablePoolsUpdatedAt)),
            ]
          : undefined,
      [
        coreLoading,
        corePools,
        extendedLoading,
        extendedPools,
        stableLoading,
        stablePools,
        allowInconsistentBlock,
        consistentBlockNumber,
        extendedPoolsUpdatedAt,
        corePoolsUpdatedAt,
        stablePoolsUpdatedAt,
      ],
    )

    const refresh = useCallback(async () => {
      return Promise.all([extendedRefresh(), coreRefresh(), stableRefresh()])
    }, [extendedRefresh, coreRefresh, stableRefresh])

    const loading = coreLoading || extendedLoading || stableLoading
    const syncing = coreSyncing || extendedSyncing || stableSyncing
    return {
      refresh,
      pools: poolsData?.[0],
      blockNumber: consistentBlockNumber,
      loading,
      syncing,
      dataUpdatedAt: poolsData?.[1],
    }
  }
}

// Get Extended pools data from on chain
export const useCommonPoolsOnChain = commonPoolsHookCreator({
  key: 'useCommonPoolsOnChain',
  useExtendedPools: useExtendedPoolsWithTicksOnChain,
})

export const useCommonPools = commonPoolsHookCreator({ key: 'useCommonPools', useExtendedPools: useExtendedCandidatePools })

// In lite version, we don't query ticks data from subgraph
export const useCommonPoolsLite = commonPoolsHookCreator({
  key: 'useCommonPoolsLite',
  useExtendedPools: useExtendedCandidatePoolsWithoutTicks,
})