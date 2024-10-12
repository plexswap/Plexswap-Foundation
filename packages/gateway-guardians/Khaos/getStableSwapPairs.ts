import { ChainId } from '@plexswap/chains'
import { deserializeToken } from '@plexswap/metalists'
import { CurrencyAmount } from '@plexswap/sdk-core'
import fromPairs_ from 'lodash/fromPairs.js'
import { getStableSwapPools, STABLE_SUPPORTED_CHAIN_IDS } from '@plexswap/hub-center/Aegis'
import { createStableSwapPair } from './stableSwap'
import { StableSwapPair } from './types'

export function getStableSwapPairs(chainId: ChainId): StableSwapPair[] {
  const pools = getStableSwapPools(chainId)
  return pools.map(
    ({
      token,
      quoteToken,
      stableSwapAddress,
      lpAddress,
      infoStableSwapAddress,
      stableLpFee,
      stableLpFeeRateOfTotalFee,
    }) => {
      const token0 = deserializeToken(token)
      const token1 = deserializeToken(quoteToken)
      return createStableSwapPair(
        {
          token0,
          token1,
          reserve0: CurrencyAmount.fromRawAmount(token0, '0'),
          reserve1: CurrencyAmount.fromRawAmount(token1, '0'),
        },
        stableSwapAddress,
        lpAddress,
        infoStableSwapAddress,
        stableLpFee,
        stableLpFeeRateOfTotalFee,
      )
    },
  )
}

export const stableSwapPairsByChainId = fromPairs_(
  STABLE_SUPPORTED_CHAIN_IDS.map((chainId) => [chainId, getStableSwapPairs(chainId)]),
)
