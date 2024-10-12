import { getFarmConfig } from '@plexswap/farms/config'
import { Token } from '@plexswap/sdk-core'
import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { VaultKey, getLivePoolsConfig } from '@plexswap/pools'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useFastRefreshEffect, useSlowRefreshEffect } from 'hooks/useRefreshEffect'
import { useEffect, useMemo } from 'react'
import { batch, useSelector } from 'react-redux'
import { useAppDispatch } from 'state'
import { useAccount } from 'wagmi'
import {
    fetchPoolsPublicDataAsync,
    fetchPoolsStakingLimitsAsync,
    fetchPoolsUserDataAsync,
    fetchWayaFlexibleVaultFees,
    fetchWayaFlexibleVaultPublicData,
    fetchWayaFlexibleVaultUserData,
    fetchWayaVaultFees,
    fetchWayaVaultPublicData,
    fetchWayaVaultUserData,
    setInitialPoolConfig,
} from '.'
import { fetchFarmsPublicDataAsync } from '../farms'
import {
  makePoolWithUserDataLoadingSelector,
  makeVaultPoolByKey,
  makeVaultPoolWithKeySelector,
  poolsWithVaultSelector,
} from './selectors'

// Only fetch farms for live pools
const getActiveFarms = async (chainId: number) => {
  const farmsConfig = (await getFarmConfig(chainId)) || []
  const livePools = getLivePoolsConfig(chainId) || []
  const lPoolAddresses = livePools
    .filter(({ poolId }) => poolId !== 0)
    .map(({ earningToken, stakingToken }) => {
      if (earningToken.symbol === 'WAYA') {
        return stakingToken.address
      }
      return earningToken.address
    })

  return farmsConfig
    .filter(
      ({ token, pid, quoteToken }) =>
        pid !== 0 &&
        ((token.symbol === 'WAYA' && quoteToken.symbol === 'WBNB') ||
         (token.symbol === 'WAYA' && quoteToken.symbol === 'BUSD') ||
         (token.symbol === 'WBNB' && quoteToken.symbol === 'BUSD') ||
          lPoolAddresses.find((poolAddress) => poolAddress === token.address)),
    )
    .map((farm) => farm.pid)
}

export const useFetchPublicPoolsData = () => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveChainId()

  useSlowRefreshEffect(() => {
    const fetchPoolsDataWithFarms = async () => {
      if (!chainId) return
      const activeFarms = await getActiveFarms(chainId)
      await dispatch(fetchFarmsPublicDataAsync({ pids: activeFarms, chainId }))

      batch(() => {
        dispatch(fetchPoolsPublicDataAsync(chainId))
        dispatch(fetchPoolsStakingLimitsAsync(chainId))
      })
    }

    fetchPoolsDataWithFarms()
  }, [dispatch, chainId])
}

export const usePool = (poolId: number): { pool?: Pool.DeserializedPool<Token>; userDataLoaded: boolean } => {
  const poolWithUserDataLoadingSelector = useMemo(() => makePoolWithUserDataLoadingSelector(poolId), [poolId])
  return useSelector(poolWithUserDataLoadingSelector)
}

export const usePoolsWithVault = () => {
  return useSelector(poolsWithVaultSelector)
}

export const useDeserializedPoolByVaultKey = (vaultKey) => {
  const vaultPoolWithKeySelector = useMemo(() => makeVaultPoolWithKeySelector(vaultKey), [vaultKey])

  return useSelector(vaultPoolWithKeySelector)
}

export const usePoolsConfigInitialize = () => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveChainId()
  useEffect(() => {
    if (chainId) {
      dispatch(setInitialPoolConfig({ chainId }))
    }
  }, [dispatch, chainId])
}

export const usePoolsPageFetch = () => {
  const dispatch = useAppDispatch()
  const { account, chainId } = useAccountActiveChain()

  usePoolsConfigInitialize()

  useFetchPublicPoolsData()

  useFastRefreshEffect(() => {
    if (chainId) {
      batch(() => {
        dispatch(fetchWayaVaultPublicData(chainId))
        dispatch(fetchWayaFlexibleVaultPublicData(chainId))
        if (account) {
          dispatch(fetchPoolsUserDataAsync({ account, chainId }))
          dispatch(fetchWayaVaultUserData({ account, chainId }))
          dispatch(fetchWayaFlexibleVaultUserData({ account, chainId }))
        }
      })
    }
  }, [account, chainId, dispatch])

  useEffect(() => {
    if (chainId) {
      batch(() => {
        dispatch(fetchWayaVaultFees(chainId))
        dispatch(fetchWayaFlexibleVaultFees(chainId))
      })
    }
  }, [dispatch, chainId])
}

export const useWayaVaultUserData = () => {
  const { address: account } = useAccount()
  const dispatch = useAppDispatch()
  const { chainId } = useActiveChainId()

  useFastRefreshEffect(() => {
    if (account && chainId) {
      dispatch(fetchWayaVaultUserData({ account, chainId }))
    }
  }, [account, dispatch, chainId])
}

export const useWayaVaultPublicData = () => {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveChainId()
  useFastRefreshEffect(() => {
    if (chainId) {
      dispatch(fetchWayaVaultPublicData(chainId))
    }
  }, [dispatch, chainId])
}

export const useWayaVault = () => {
  return useVaultPoolByKey(VaultKey.WayaVault)
}

export const useVaultPoolByKey = (key?: VaultKey) => {
  const vaultPoolByKey = useMemo(() => makeVaultPoolByKey(key), [key])

  return useSelector(vaultPoolByKey)
}
