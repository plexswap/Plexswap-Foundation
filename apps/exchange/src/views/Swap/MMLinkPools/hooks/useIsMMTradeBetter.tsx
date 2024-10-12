import { SmartRouterTrade } from '@plexswap/gateway-guardians/Ananke'
import { Currency, Trade, TradeType, ZERO } from '@plexswap/sdk-core'
import { useMemo } from 'react'
import { Field } from 'state/swap/actions'

interface Options<T> {
  independentField: Field
  trade?: T | null
  coreTrade?: Pick<Trade<Currency, Currency, TradeType>, 'inputAmount' | 'outputAmount'> | null
  tradeWithMM?: SmartRouterTrade<TradeType> | null
  isMMQuotingPair?: boolean
  isExpertMode?: boolean
}

export const useIsTradeWithMMBetter = <T extends Pick<SmartRouterTrade<TradeType>, 'inputAmount' | 'outputAmount'>>({
  independentField,
  trade,
  coreTrade,
  tradeWithMM,
  isExpertMode = false,
}: Options<T>) => {
  return useMemo(() => {
    const isExactIn = independentField === Field.INPUT
    if (
      isExpertMode ||
      !tradeWithMM ||
      tradeWithMM.inputAmount.equalTo(ZERO) ||
      tradeWithMM.outputAmount.equalTo(ZERO)
    ) {
      return false
    }
    if (!coreTrade && !trade && tradeWithMM) return true // v2 and smart router has not liq but MM provide the deal
    if (coreTrade && !trade) {
      // compare with v2 only
      if (!coreTrade?.outputAmount || !coreTrade?.inputAmount) {
        if (tradeWithMM) return true
      }
      return (
        // exactIn
        (isExactIn && tradeWithMM.outputAmount.greaterThan(coreTrade?.outputAmount ?? ZERO)) ||
        // exactOut
        (!isExactIn && tradeWithMM.inputAmount.lessThan(coreTrade?.inputAmount ?? ZERO))
      )
    }
    if (!coreTrade && trade) {
      // compare with smart router only
      if (!trade?.outputAmount || !trade?.inputAmount) {
        if (tradeWithMM) return true
      }
      return (
        // exactIn
        (isExactIn && tradeWithMM.outputAmount.greaterThan(trade?.outputAmount ?? ZERO)) ||
        // exactOut
        (!isExactIn && tradeWithMM.inputAmount.lessThan(trade?.inputAmount ?? ZERO))
      )
    }
    // compare with smart router and v2 at same time
    return (
      // exactIn
      (isExactIn &&
        tradeWithMM.outputAmount.greaterThan(trade?.outputAmount ?? ZERO) &&
        tradeWithMM.outputAmount.greaterThan(coreTrade?.outputAmount ?? ZERO)) ||
      // exactOut
      (!isExactIn &&
        tradeWithMM.inputAmount.lessThan(trade?.inputAmount ?? ZERO) &&
        tradeWithMM.inputAmount.lessThan(coreTrade?.inputAmount ?? ZERO))
    )
  }, [trade, coreTrade, tradeWithMM, isExpertMode, independentField])
}
