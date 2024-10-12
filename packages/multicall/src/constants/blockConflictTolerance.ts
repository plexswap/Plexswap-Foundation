import { ChainId } from '@plexswap/chains'

export const DEFAULT_BLOCK_CONFLICT_TOLERANCE = 0

export const BLOCK_CONFLICT_TOLERANCE: { [key in ChainId]?: number } = {
  [ChainId.BSC]: 3,
  [ChainId.PLEXCHAIN]: 1,

  // Testnets
  [ChainId.BSC_TESTNET]: 3,
}
