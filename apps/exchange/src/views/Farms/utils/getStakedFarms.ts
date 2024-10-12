import BigNumber from 'bignumber.js'
import { CoreFarmWithoutStakedValue, ExtendedFarmWithoutStakedValue } from 'state/farms/types'

export const getStakedFarms = (
  farmsData: (ExtendedFarmWithoutStakedValue | CoreFarmWithoutStakedValue)[],
): (ExtendedFarmWithoutStakedValue | CoreFarmWithoutStakedValue)[] => {
  return farmsData.filter((farm) => {
    if (farm.version === 11) {
      return farm.stakedPositions.length > 0
    }
    return (
      new BigNumber(farm?.userData?.stakedBalance ?? 0).gt(0) ||
      new BigNumber(farm?.userData?.proxy?.stakedBalance ?? 0).gt(0) ||
      new BigNumber(farm?.wayaUserData?.stakedBalance ?? 0).gt(0)
    )
  })
}
