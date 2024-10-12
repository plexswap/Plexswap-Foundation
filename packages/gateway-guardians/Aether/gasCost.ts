import { TickList } from '@plexswap/sdk-extended'
import invariant from 'tiny-invariant'

import {
    BASE_SWAP_COST_EXTENDED,
    BASE_SWAP_COST_STABLE_SWAP,
    BASE_SWAP_COST_CORE,
    COST_PER_HOP_EXTENDED,
    COST_PER_INIT_TICK,
} from '../config/constants'
import { PoolQuote } from '../Ananke/providers'
import { isExtendedPool, isStablePool, isCorePool } from '../Ananke/utils'

export function estimateGasCost({ pool, poolAfter }: Omit<PoolQuote, 'quote'>): bigint {
  if (isCorePool(pool)) {
    return BASE_SWAP_COST_CORE
  }

  if (isExtendedPool(pool) && isExtendedPool(poolAfter)) {
    const { ticks, token0, tick } = pool
    invariant(ticks !== undefined, '[Estimate gas]: No valid tick list found')
    const { tick: tickAfter } = poolAfter
    const { chainId } = token0
    const numOfTicksCrossed = TickList.countInitializedTicksCrossed(ticks, tick, tickAfter)
    const tickGasUse = COST_PER_INIT_TICK(chainId) * BigInt(numOfTicksCrossed)
    return BASE_SWAP_COST_EXTENDED(chainId) + COST_PER_HOP_EXTENDED(chainId) + tickGasUse
  }

  if (isStablePool(pool)) {
    return BASE_SWAP_COST_STABLE_SWAP
  }

  throw new Error('[Estimate gas]: Unknown pool type')
}
