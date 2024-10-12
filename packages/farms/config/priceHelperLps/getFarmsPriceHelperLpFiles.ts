import { ChainId } from '@plexswap/chains'
import FarmsBscPriceHelper from './56'
import FarmsBscTestnetPriceHelper from './97'
import FarmsPlexchainPriceHelper from './1149'

export const getFarmsPriceHelperLpFiles = (chainId: ChainId) => {
  switch (chainId) {
    case ChainId.BSC:
      return FarmsBscPriceHelper
    case ChainId.BSC_TESTNET:
      return FarmsBscTestnetPriceHelper
    case ChainId.PLEXCHAIN:
      return FarmsPlexchainPriceHelper
    default:
      return []
  }
}
