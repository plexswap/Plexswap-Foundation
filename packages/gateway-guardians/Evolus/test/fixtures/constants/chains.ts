import { ChainId } from '@plexswap/chains'
import {
    bsc,
    bscTestnet,
} from 'viem/chains'

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS: ChainId[] = [

]

export const CHAINS = [
  bsc,
  bscTestnet,
]
