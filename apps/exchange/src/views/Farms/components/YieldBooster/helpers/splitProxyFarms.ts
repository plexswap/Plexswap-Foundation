import { SerializedFarmConfig } from '@plexswap/farms'
import groupBy from 'lodash/groupBy'
import isUndefinedOrNull from '@plexswap/utils/isUndefinedOrNull'

interface SplitProxyFarmsResponse {
  normalFarms: SerializedFarmConfig[]
  farmsWithProxy: SerializedFarmConfig[]
}

export default function splitProxyFarms(farms: SerializedFarmConfig[]): SplitProxyFarmsResponse {
  const { false: normalFarms, true: farmsWithProxy } = groupBy(farms, (farm) =>
    isUndefinedOrNull(farm.boosted) ? false : farm.boosted,
  )

  return { normalFarms, farmsWithProxy }
}
