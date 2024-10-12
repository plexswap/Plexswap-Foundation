import { getFarmsPriceHelperLpFiles } from '@plexswap/farms/config/priceHelperLps/getFarmsPriceHelperLpFiles'
import { ChainId } from '@plexswap/chains'
import PoolsBscPriceHelper from './pools/56'
import PoolsBscTestnetPriceHelper from './pools/97'
import PoolsPlexchainPriceHelper from './pools/1149'

export { getFarmsPriceHelperLpFiles }

export const getPoolsPriceHelperLpFiles = (chainId: ChainId) => {
  switch (chainId) {
    case ChainId.BSC:
      return PoolsBscPriceHelper
    case ChainId.BSC_TESTNET:
      return PoolsBscTestnetPriceHelper
    case ChainId.PLEXCHAIN:
      return PoolsPlexchainPriceHelper
    default:
      return []
  }
}
