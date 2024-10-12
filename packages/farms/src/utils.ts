import { FarmExtendedData } from './types'

export function isActiveExtendedFarm(farm: FarmExtendedData, poolLength: number) {
  return farm.pid !== 0 && farm.multiplier !== '0X' && poolLength && poolLength >= farm.pid
}
