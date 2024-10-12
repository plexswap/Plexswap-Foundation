import { ChainId } from '@plexswap/chains'

// Revalidate interval in milliseconds
export const POOLS_FAST_REVALIDATE = {
  [ChainId.BSC_TESTNET]: 10_000,
  [ChainId.BSC]: 10_000,
  [ChainId.PLEXCHAIN]: 20_000,
} as const satisfies Record<ChainId, number>

// Revalidate interval in milliseconds
export const POOLS_NORMAL_REVALIDATE = {
  [ChainId.BSC_TESTNET]: 15_000,
  [ChainId.BSC]: 15_000,
  [ChainId.PLEXCHAIN]: 20_000,
} as const satisfies Record<ChainId, number>

export const POOLS_SLOW_REVALIDATE = {
  [ChainId.BSC_TESTNET]: 20_000,
  [ChainId.BSC]: 20_000,
  [ChainId.PLEXCHAIN]: 40_000,
} as const satisfies Record<ChainId, number>
