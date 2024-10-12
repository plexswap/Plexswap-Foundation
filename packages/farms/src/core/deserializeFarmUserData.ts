import { bscTestnetTokens } from '@plexswap/tokens'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { getBalanceAmount } from '@plexswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import { DeserializedWayaWrapperUserData, DeserializedFarmUserData, SerializedFarm } from '../types'

export const deserializeFarmUserData = (farm?: SerializedFarm): DeserializedFarmUserData => {
  return {
    allowance: farm?.userData ? new BigNumber(farm.userData.allowance) : BIG_ZERO,
    tokenBalance: farm?.userData ? new BigNumber(farm.userData.tokenBalance) : BIG_ZERO,
    stakedBalance: farm?.userData ? new BigNumber(farm.userData.stakedBalance) : BIG_ZERO,
    earnings: farm?.userData ? new BigNumber(farm.userData.earnings) : BIG_ZERO,
    proxy: {
      allowance: farm?.userData?.proxy ? new BigNumber(farm?.userData?.proxy.allowance) : BIG_ZERO,
      tokenBalance: farm?.userData?.proxy ? new BigNumber(farm?.userData?.proxy.tokenBalance) : BIG_ZERO,
      stakedBalance: farm?.userData?.proxy ? new BigNumber(farm?.userData?.proxy.stakedBalance) : BIG_ZERO,
      earnings: farm?.userData?.proxy ? new BigNumber(farm?.userData?.proxy.earnings) : BIG_ZERO,
    },
  }
}

export const deserializeFarmWayaUserData = (farm?: SerializedFarm): DeserializedWayaWrapperUserData => {
  return {
    allowance: farm?.wayaUserData ? new BigNumber(farm.wayaUserData.allowance) : BIG_ZERO,
    tokenBalance: farm?.wayaUserData ? new BigNumber(farm.wayaUserData.tokenBalance) : BIG_ZERO,
    stakedBalance: farm?.wayaUserData ? new BigNumber(farm.wayaUserData.stakedBalance) : BIG_ZERO,
    earnings: farm?.wayaUserData ? new BigNumber(farm.wayaUserData.earnings) : BIG_ZERO,
    boosterMultiplier: farm?.wayaUserData?.boosterMultiplier ?? 1,
    boostedAmounts: farm?.wayaUserData?.boostedAmounts ? new BigNumber(farm.wayaUserData.boostedAmounts) : BIG_ZERO,
    boosterContractAddress: farm?.wayaUserData?.boosterContractAddress,
    rewardPerSecond: farm?.wayaUserData?.rewardPerSecond
      ? getBalanceAmount(new BigNumber(farm?.wayaUserData?.rewardPerSecond), bscTestnetTokens.waya.decimals).toNumber()
      : 0,
    startTimestamp: farm?.wayaUserData?.startTimestamp,
    endTimestamp: farm?.wayaUserData?.endTimestamp,
  }
}

export const deserializeFarmWayaPublicData = (farm?: SerializedFarm): DeserializedWayaWrapperUserData => {
  // const isRewardInRange = true
  const isRewardInRange =
    farm?.wayaPublicData?.startTimestamp &&
    farm?.wayaPublicData?.endTimestamp &&
    Date.now() / 1000 >= farm.wayaPublicData.startTimestamp &&
    Date.now() / 1000 < farm.wayaPublicData.endTimestamp
  return {
    allowance: farm?.wayaPublicData ? new BigNumber(farm.wayaPublicData.allowance) : BIG_ZERO,
    tokenBalance: farm?.wayaPublicData ? new BigNumber(farm.wayaPublicData.tokenBalance) : BIG_ZERO,
    stakedBalance: farm?.wayaPublicData ? new BigNumber(farm.wayaPublicData.stakedBalance) : BIG_ZERO,
    earnings: farm?.wayaPublicData ? new BigNumber(farm.wayaPublicData.earnings) : BIG_ZERO,
    boosterMultiplier: isRewardInRange ? farm?.wayaPublicData?.boosterMultiplier ?? 1 : 1,
    boostedAmounts: farm?.wayaPublicData?.boostedAmounts
      ? new BigNumber(farm.wayaPublicData.boostedAmounts)
      : BIG_ZERO,
    boosterContractAddress: farm?.wayaPublicData?.boosterContractAddress,
    rewardPerSecond:
      farm?.wayaPublicData?.rewardPerSecond && isRewardInRange
        ? getBalanceAmount(
            new BigNumber(farm?.wayaPublicData?.rewardPerSecond),
            bscTestnetTokens.waya.decimals,
          ).toNumber()
        : 0,
    startTimestamp: farm?.wayaPublicData?.startTimestamp,
    endTimestamp: farm?.wayaPublicData?.endTimestamp,
    isRewardInRange: Boolean(isRewardInRange),
  }
}
