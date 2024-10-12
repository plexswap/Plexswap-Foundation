import { DeserializedFarm, FarmExtendedDataWithPriceAndUserInfo } from '@plexswap/farms'

export interface ExtendedFarmWithoutStakedValue extends FarmExtendedDataWithPriceAndUserInfo {
  version: 11
}

export interface CoreFarmWithoutStakedValue extends DeserializedFarm {
  version: 1
}
