import { Token } from '@plexswap/sdk-core'
import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { VaultKey } from '@plexswap/pools'
import { useQuery } from '@tanstack/react-query'
import orderBy from 'lodash/orderBy'
import partition from 'lodash/partition'
import { useEffect, useState } from 'react'
import { useAppDispatch } from 'state'
import {
    fetchPoolsPublicDataAsync,
    fetchWayaVaultFees,
    fetchWayaVaultPublicData,
    setInitialPoolConfig,
} from 'state/pools'
import { usePoolsWithVault } from 'state/pools/hooks'

const useGetTopPoolsByApr = (isIntersecting: boolean, chainId?: number) => {
  const dispatch = useAppDispatch()
  const [topPools, setTopPools] = useState<(Pool.DeserializedPool<Token> | any)[]>(() => [null, null, null, null, null])
  const { pools } = usePoolsWithVault()

  const { status: fetchStatus, isFetching } = useQuery({
    queryKey: [chainId, 'fetchTopPoolsByApr'],

    queryFn: async () => {
      await dispatch(setInitialPoolConfig({ chainId }))
      return Promise.all([
        dispatch(fetchWayaVaultFees(chainId!)),
        dispatch(fetchWayaVaultPublicData(chainId!)),
        dispatch(fetchPoolsPublicDataAsync(chainId!)),
      ])
    },

    enabled: Boolean(isIntersecting && chainId),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const [wayaPools, otherPools] = partition(pools, (pool) => pool.poolId === 0)
    const masterWayaPool = wayaPools.filter((wayaPool) => wayaPool.vaultKey === VaultKey.WayaVault)
    const getTopPoolsByApr = (activePools: (Pool.DeserializedPool<Token> | any)[]) => {
      const sortedByApr = orderBy(activePools, (pool: Pool.DeserializedPool<Token>) => pool.apr || 0, 'desc')
      setTopPools([...masterWayaPool, ...sortedByApr.slice(0, 4)])
    }
    if (fetchStatus === 'success' && !isFetching) {
      getTopPoolsByApr(otherPools)
    }
  }, [setTopPools, pools, isFetching, fetchStatus])

  return { topPools }
}

export default useGetTopPoolsByApr
