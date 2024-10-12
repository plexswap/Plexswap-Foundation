import { DeserializedFarm } from '@plexswap/farms'
import BigNumber from 'bignumber.js'

export const getStakedMinProgramFarms = (farmsData: DeserializedFarm[]): DeserializedFarm[] => {
  return farmsData.filter((farm) => {
    return (
      farm.userData &&
      (new BigNumber(farm.userData.stakedBalance).isGreaterThan(0) ||
        new BigNumber(farm?.userData?.proxy?.stakedBalance ?? 0).isGreaterThan(0))
    )
  })
}
