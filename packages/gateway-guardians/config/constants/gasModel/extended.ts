import { ChainId } from '@plexswap/chains'

// Cost for crossing an uninitialized tick.
export const COST_PER_UNINIT_TICK = 0n

export const BASE_SWAP_COST_EXTENDED = (id: ChainId): bigint => {
  switch (id) {
    case ChainId.BSC:
    case ChainId.BSC_TESTNET:
    case ChainId.PLEXCHAIN:
      return 2000n
    default:
      return 0n
  }
}
export const COST_PER_INIT_TICK = (id: ChainId): bigint => {
  switch (id) {
    case ChainId.BSC:
    case ChainId.BSC_TESTNET:
    case ChainId.PLEXCHAIN:
      return 31000n
    default:
      return 0n
  }
}

export const COST_PER_HOP_EXTENDED = (id: ChainId): bigint => {
  switch (id) {
    case ChainId.BSC:
    case ChainId.BSC_TESTNET:
    case ChainId.PLEXCHAIN:
      return 80000n
    default:
      return 0n
  }
}
