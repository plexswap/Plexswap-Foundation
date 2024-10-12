import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useWayaFarmWrapperBoosterVoterContract } from 'hooks/useContract'
import { useMemo } from 'react'
import { Address } from 'viem'

const SHOULD_UPDATE_THRESHOLD = 1.1

export const useWrapperBooster = (wayaBoosterAddress: Address, boostMultiplier: number, wrapperAddress?: Address) => {
  const wayaFarmWrapperBoosterVoterContract = useWayaFarmWrapperBoosterVoterContract(wayaBoosterAddress)
  const { account } = useActiveWeb3React()
  const { data, refetch } = useQuery({
    queryKey: ['useWrapperBooster', wayaBoosterAddress, account, wrapperAddress],
    queryFn: () =>
      wayaFarmWrapperBoosterVoterContract.read.getUserMultiplierByWrapper([account ?? '0x', wrapperAddress ?? '0x']),
    enabled: !!wayaBoosterAddress && !!account && !!wrapperAddress,
    refetchInterval: 10000,
    staleTime: 10000,
    gcTime: 10000,
  })

  const { data: BOOST_PRECISION } = useQuery({
    queryKey: ['useWrapperBooster_BOOST_PRECISION', wayaBoosterAddress],
    queryFn: () => wayaFarmWrapperBoosterVoterContract.read.BOOST_PRECISION(),
    enabled: !!wayaBoosterAddress,
  })

  const voterUserMultiplierBeforeBoosted = useMemo(() => {
    return data && BOOST_PRECISION && Boolean(wrapperAddress)
      ? Number(new BigNumber(data.toString()).div(BOOST_PRECISION.toString()))
      : 0
  }, [BOOST_PRECISION, data, wrapperAddress])

  const shouldUpdate = useMemo(() => {
    if (
      (boostMultiplier &&
        voterUserMultiplierBeforeBoosted &&
        boostMultiplier * SHOULD_UPDATE_THRESHOLD <= voterUserMultiplierBeforeBoosted) ||
      (boostMultiplier === 1 && voterUserMultiplierBeforeBoosted > boostMultiplier)
    )
      return true
    return false
  }, [boostMultiplier, voterUserMultiplierBeforeBoosted])

  return { voterUserMultiplierBeforeBoosted, refetchWrapperBooster: refetch, shouldUpdate }
}

export const useIsWrapperWhiteList = (wayaBoosterAddress?: Address, wrapperAddress?: Address) => {
  const wayaFarmWrapperBoosterVoterContract = useWayaFarmWrapperBoosterVoterContract(wayaBoosterAddress ?? `0x`)
  const { data } = useQuery({
    queryKey: ['useIsWrapperWhiteList', wayaBoosterAddress, wrapperAddress],
    queryFn: () => wayaFarmWrapperBoosterVoterContract.read.whiteListWrapper([wrapperAddress ?? '0x']),
    enabled: !!wayaBoosterAddress && !!wrapperAddress,
    refetchInterval: 10000,
    staleTime: 10000,
    gcTime: 10000,
  })

  const isBoosterWhiteList = useMemo(() => {
    if (!wayaBoosterAddress || !wrapperAddress) return false
    return Boolean(data)
  }, [wayaBoosterAddress, data, wrapperAddress])

  return { isBoosterWhiteList }
}
