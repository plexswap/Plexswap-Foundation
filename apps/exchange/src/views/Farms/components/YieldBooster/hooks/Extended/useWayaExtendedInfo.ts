import { ChainId } from '@plexswap/chains'
import { wayaSupportedChainId } from '@plexswap/farms'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import BN from 'bignumber.js'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useChieffarmerExtended, useFarmBoosterExtendedContract, useFarmBoosterVoterContract } from 'hooks/useContract'
import _toNumber from 'lodash/toNumber'
import { useCallback, useMemo } from 'react'
import { useWayaLockStatus } from 'views/WayaStaking/hooks/useVoterUserInfo'
import { WayaLockStatus } from 'views/WayaStaking/types'
import { useReadContract } from 'wagmi'
import { PRECISION_FACTOR, getUserMultiplier } from './multiplierAPI'

export const USER_ESTIMATED_MULTIPLIER = 2

const QUERY_SETTINGS_WITHOUT_REFETCH = {
  retry: 3,
  retryDelay: 3000,
  placeholderData: keepPreviousData,
}

export const useSowExtendedFarmCanBoost = (farmPid: number) => {
  const { chainId } = useActiveChainId()
  const farmBoosterExtendedContract = useFarmBoosterVoterContract()
  const { data } = useReadContract({
    abi: farmBoosterExtendedContract.abi,
    address: farmBoosterExtendedContract.address,
    chainId,
    functionName: 'whiteList',
    query: {
      enabled: Boolean(chainId && farmPid && wayaSupportedChainId.includes(chainId)),
    },
    args: [BigInt(farmPid ?? 0)],
  })
  return { farmCanBoost: data }
}

export const useIsBoostedPoolLegacy = (tokenId?: string) => {
  const { chainId } = useActiveChainId()
  const farmBoosterExtendedContract = useFarmBoosterExtendedContract()
  const { data, refetch } = useQuery({
    queryKey: [`extended/waya/isBoostedPoolLegacy/${chainId}/${tokenId}`],
    queryFn: () => farmBoosterExtendedContract.read.isBoostedPool([BigInt(tokenId ?? 0)]),
    enabled: Boolean(chainId && tokenId && tokenId !== 'undefined'),
    ...QUERY_SETTINGS_WITHOUT_REFETCH,
  })
  return { isBoosted: data?.[0], pid: Number(data?.[1]), mutate: refetch }
}

export const useIsBoostedPool = (tokenId?: string) => {
  const { chainId } = useActiveChainId()
  const farmBoosterExtendedContract = useFarmBoosterVoterContract()
  const { data, refetch } = useQuery({
    queryKey: [`extended/waya/isBoostedPool/${chainId}/${tokenId}`],
    queryFn: () => farmBoosterExtendedContract.read.isBoostedPool([BigInt(tokenId ?? 0)]),
    enabled: Boolean(chainId && tokenId && tokenId !== 'undefined'),
    ...QUERY_SETTINGS_WITHOUT_REFETCH,
  })
  return { isBoosted: data?.[0], pid: Number(data?.[1]), mutate: refetch }
}

export const useUserPositionInfo = (tokenId?: string) => {
  const { chainId } = useActiveChainId()
  const chiefFarmerExtended = useChieffarmerExtended()
  const { data, refetch } = useQuery({
    queryKey: [`extended/chiefFarmer/userPositionInfos/${chainId}/${tokenId}`],
    queryFn: () => chiefFarmerExtended?.read.userPositionInfos([BigInt(tokenId ?? 0)]),
    enabled: Boolean(chainId && tokenId),
    ...QUERY_SETTINGS_WITHOUT_REFETCH,
  })

  return {
    data: {
      liquidity: data?.[0],
      boostLiquidity: data?.[1],
      tickLower: data?.[2],
      tickUpper: data?.[3],
      rewardGrowthInside: data?.[4],
      reward: data?.[5],
      user: data?.[6],
      pid: data?.[7],
      boostMultiplier: _toNumber(new BN(data?.[8]?.toString() ?? 0).div(PRECISION_FACTOR).toString()),
    },
    updateUserPositionInfo: refetch,
  }
}

export const useUserBoostedPoolsTokenId = () => {
  const { account, chainId } = useAccountActiveChain()
  const farmBoosterExtendedContract = useFarmBoosterVoterContract()
  const farmBoosterExtendedContractLegacy = useFarmBoosterExtendedContract()

  const { data, refetch } = useQuery({
    queryKey: [`extended/waya/userBoostedPools/${chainId}/${account}`],
    queryFn: () => farmBoosterExtendedContract.read.activedPositions([account ?? '0x']),
    enabled: Boolean(chainId && account),
    ...QUERY_SETTINGS_WITHOUT_REFETCH,
  })

  const { data: dataLegacy, refetch: refetchLegacy } = useQuery({
    queryKey: [`extended/waya/userBoostedPoolsLegacy/${chainId}/${account}`],
    queryFn: () => farmBoosterExtendedContractLegacy.read.activedPositions([account ?? '0x']),
    enabled: Boolean(chainId && account),
    ...QUERY_SETTINGS_WITHOUT_REFETCH,
  })

  const updateBoostedPoolsTokenId = useCallback(() => {
    refetch()
    refetchLegacy()
  }, [refetch, refetchLegacy])

  return useMemo(() => {
    const tokenIds = data?.map((tokenId) => Number(tokenId)) ?? []
    const tokenIdsLegacy = dataLegacy?.map((tokenId) => Number(tokenId)) ?? []

    return {
      tokenIds: [...tokenIds, ...tokenIdsLegacy],
      updateBoostedPoolsTokenId,
    }
  }, [data, dataLegacy, updateBoostedPoolsTokenId])
}

export const useVoterUserMultiplierBeforeBoosted = (tokenId?: string) => {
  const { chainId } = useActiveChainId()
  const farmBoosterExtendedContract = useFarmBoosterVoterContract()
  const { data, refetch } = useQuery({
    queryKey: [`extended/waya/useUserMultiplierBeforeBoosted/${chainId}/${tokenId}`],
    queryFn: () => getUserMultiplier({ address: farmBoosterExtendedContract.address, tokenId, chainId }),
    enabled: Boolean(chainId && tokenId),
    ...QUERY_SETTINGS_WITHOUT_REFETCH,
  })

  return {
    voterUserMultiplierBeforeBoosted: data ? (data > 2 ? 2 : data) : 1,
    updatedUserMultiplierBeforeBoosted: refetch,
  }
}

export const useWayaBoostLimitAndLockInfo = (targetChain: ChainId = ChainId.BSC) => {
  const { status } = useWayaLockStatus(targetChain)
  const isLockEnd = useMemo(() => status === WayaLockStatus.Expired, [status])
  const locked = useMemo(() => status === WayaLockStatus.Locking, [status])

  return { locked, isLockEnd }
}
