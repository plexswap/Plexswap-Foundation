import { ChainId } from '@plexswap/chains'
import { Token } from '@plexswap/sdk-core'
import {
  bscTestnetTokens,
  bscTokens,
  plexchainTokens,
} from '@plexswap/tokens'

export const usdGasTokensByChain = {
  [ChainId.PLEXCHAIN]: [plexchainTokens.usdp],
  [ChainId.BSC]: [bscTokens.usdt],
  [ChainId.BSC_TESTNET]: [bscTestnetTokens.usdc],
} satisfies Record<ChainId, Token[]>

export * from './core'
export * from './extended'
export * from './stableSwap'

