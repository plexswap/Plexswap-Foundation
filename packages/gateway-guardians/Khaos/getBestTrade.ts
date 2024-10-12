import { Currency, CurrencyAmount, TradeType } from '@plexswap/sdk-core'
import { getBestTradeFromStablePools } from './getBestTradeFromStablePools'

import { getBestTradeFromCoreExactIn, getBestTradeFromCoreExactOut } from './getBestTradeFromCore'
import { getBestTradeWithStableSwap } from './getBestTradeWithStableSwap'
import { stableSwapPairsByChainId } from './getStableSwapPairs'
import { createTradeWithStableSwapFromCoreTrade } from './stableSwap'
import { BestTradeOptions, TradeWithStableSwap } from './types'

export const getBestTradeExactIn = createGetBestTrade(TradeType.EXACT_INPUT)

export const getBestTradeExactOut = createGetBestTrade(TradeType.EXACT_OUTPUT)

function createGetBestTrade<TTradeType extends TradeType>(tradeType: TTradeType) {
  const isExactIn = tradeType === TradeType.EXACT_INPUT
  const getBestTradeFromCore = isExactIn ? getBestTradeFromCoreExactIn : getBestTradeFromCoreExactOut
  return async function getBestTrade(
    amountIn: CurrencyAmount<Currency>,
    output: Currency,
    options: BestTradeOptions,
  ): Promise<TradeWithStableSwap<Currency, Currency, TradeType> | null> {
    const { provider } = options
    // TODO invariant check input and output on the same chain
    const {
      currency: { chainId },
    } = amountIn

    const bestTradeCore = await getBestTradeFromCore(amountIn, output, options)
    const bestTradeStable =
      (bestTradeCore || isExactIn) &&
      (await getBestTradeFromStablePools(
        bestTradeCore?.inputAmount || amountIn,
        bestTradeCore?.outputAmount.currency || output,
        options,
      ))

    if (!bestTradeCore) {
      if (bestTradeStable) {
        return bestTradeStable
      }
      return null
    }

    const stableSwapPairs = stableSwapPairsByChainId[chainId] || []
    const bestTradeWithStableSwap = await getBestTradeWithStableSwap(bestTradeCore, stableSwapPairs, { provider })
    const { outputAmount: outputAmountWithStableSwap } = bestTradeWithStableSwap

    if (
      bestTradeStable &&
      bestTradeStable.outputAmount.greaterThan(outputAmountWithStableSwap) &&
      bestTradeStable.outputAmount.greaterThan(bestTradeCore.outputAmount)
    ) {
      return bestTradeStable
    }

    // If stable swap is not as good as best trade got from v2, then use v2
    if (outputAmountWithStableSwap.lessThan(bestTradeCore.outputAmount)) {
      return createTradeWithStableSwapFromCoreTrade(bestTradeCore)
    }

    return bestTradeWithStableSwap
  }
}
