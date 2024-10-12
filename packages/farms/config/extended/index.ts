import { ChainId } from '@plexswap/chains'
import { Address } from 'viem'
import { TFarmExtendedSupportedChainId } from '../../src'
import { ComputedFarmConfigExtended } from '../../src/types'
import { farmsExtended as bscFarms } from '../bsc'
import { farmsExtended as bscTestnetFarms } from '../bscTestnet'
import { farmsExtended as plexchainFarms } from '../plexchain'

export const farmsExtendedConfigChainMap: Record<TFarmExtendedSupportedChainId, ComputedFarmConfigExtended[]> = {
  [ChainId.PLEXCHAIN]: plexchainFarms,
  [ChainId.BSC]: bscFarms,
  [ChainId.BSC_TESTNET]: bscTestnetFarms,
}

export type Addresses = {
  [chainId in ChainId]?: Address
}
// LOOKUP //
export const FarmBoosterExtendedAddress: Addresses = {
  [ChainId.BSC]: '0x695170faE243147b3bEB4C43AA8DE5DcD9202752',
  [ChainId.BSC_TESTNET]: '0x56666300A1E25624489b661f3C6c456c159a109a',
}

// LOOKUP //
export const FarmBoosterVoterAddress: Addresses = {
  [ChainId.BSC]: '0x625F45234D6335859a8b940960067E89476300c6',
  [ChainId.BSC_TESTNET]: '0x1F32591CC45f00BaE3A742Bf2bCAdAe59DbAd228',
}
