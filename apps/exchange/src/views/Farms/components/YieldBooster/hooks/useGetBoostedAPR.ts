import BigNumber from 'bignumber.js'
import _toNumber from 'lodash/toNumber'
import { useMemo } from 'react'
import { useWayaVaultPublicData, useWayaVaultUserData } from 'state/pools/hooks'
import { getWayaMultiplier } from 'views/Farms/components/YieldBooster/components/WayaCalculator'
import { useUserLockedWayaStatus } from 'views/Farms/hooks/useUserLockedWayaStatus'
import useAvgLockDuration from 'views/Pools/components/LockedPool/hooks/useAvgLockDuration'
import { secondsToDays } from 'views/Pools/components/utils/formatSecondsToWeeks'
import useFarmBoosterConstants from './useFarmBoosterConstants'

export const useGetBoostedMultiplier = (userBalanceInFarm: BigNumber, lpTokenStakedAmount: BigNumber) => {
  useWayaVaultPublicData()
  useWayaVaultUserData()
  const { avgLockDurationsInSeconds } = useAvgLockDuration()
  const { isLoading, lockedAmount, totalLockedAmount, lockedStart, lockedEnd } = useUserLockedWayaStatus()
  const { constants, isLoading: isFarmConstantsLoading } = useFarmBoosterConstants()
  const WayaMultiplier = useMemo(() => {
    const result =
      !isLoading && !isFarmConstantsLoading && lockedAmount && totalLockedAmount
        ? getWayaMultiplier(
            userBalanceInFarm, // userBalanceInFarm,
            lockedAmount, // userLockAmount
            secondsToDays(_toNumber(lockedEnd) - _toNumber(lockedStart)), // userLockDuration
            totalLockedAmount, // totalLockAmount
            lpTokenStakedAmount, // lpBalanceOfFarm
            avgLockDurationsInSeconds ? secondsToDays(avgLockDurationsInSeconds) : 280, // AverageLockDuration
            constants?.lMaxBoost ?? 1,
            constants?.cDifficulties ?? 1,
          )
        : null
    return !result || result.toString() === 'NaN' ? '1.000' : result.toFixed(3)
  }, [
    userBalanceInFarm,
    lpTokenStakedAmount,
    totalLockedAmount,
    avgLockDurationsInSeconds,
    lockedAmount,
    lockedEnd,
    lockedStart,
    isLoading,
    isFarmConstantsLoading,
    constants,
  ])
  return _toNumber(WayaMultiplier)
}

export const useGetCalculatorMultiplier = (
  userBalanceInFarm: BigNumber,
  lpTokenStakedAmount: BigNumber,
  lockedAmount: BigNumber,
  userLockDuration: number,
) => {
  useWayaVaultPublicData()
  useWayaVaultUserData()
  const { avgLockDurationsInSeconds } = useAvgLockDuration()
  const { isLoading, totalLockedAmount } = useUserLockedWayaStatus()
  const { constants, isLoading: isFarmConstantsLoading } = useFarmBoosterConstants()
  const WayaMultiplier = useMemo(() => {
    const result =
      !isLoading && !isFarmConstantsLoading && lockedAmount && totalLockedAmount
        ? getWayaMultiplier(
            userBalanceInFarm, // userBalanceInFarm,
            lockedAmount, // userLockAmount
            secondsToDays(userLockDuration), // userLockDuration
            totalLockedAmount, // totalLockAmount
            lpTokenStakedAmount, // lpBalanceOfFarm
            avgLockDurationsInSeconds ? secondsToDays(avgLockDurationsInSeconds) : 280, // AverageLockDuration,
            constants?.lMaxBoost ?? 1,
            constants?.cDifficulties ?? 1,
          )
        : null
    return !result || result.toString() === 'NaN' ? '1.000' : result.toFixed(3)
  }, [
    userBalanceInFarm,
    lpTokenStakedAmount,
    totalLockedAmount,
    avgLockDurationsInSeconds,
    lockedAmount,
    isLoading,
    isFarmConstantsLoading,
    userLockDuration,
    constants,
  ])
  return _toNumber(WayaMultiplier)
}

const useGetBoostedAPR = (
  userBalanceInFarm: BigNumber,
  lpTokenStakedAmount: BigNumber,
  apr: number,
  lpRewardsApr: number,
) => {
  const WayaMultiplier = useGetBoostedMultiplier(userBalanceInFarm, lpTokenStakedAmount)
  return (apr * WayaMultiplier + lpRewardsApr).toFixed(2)
}

export default useGetBoostedAPR