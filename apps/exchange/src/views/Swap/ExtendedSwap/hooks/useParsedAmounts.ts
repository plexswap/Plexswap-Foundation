import { Currency, CurrencyAmount, TradeType } from '@plexswap/sdk-core'
import { SmartRouterTrade } from '@plexswap/gateway-guardians/Ananke'
import tryParseAmount from '@plexswap/utils/tryParseAmount'

import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'

interface Balances {
  [Field.INPUT]?: CurrencyAmount<Currency>
  [Field.OUTPUT]?: CurrencyAmount<Currency>
}

export function useParsedAmounts(
  trade: SmartRouterTrade<TradeType> | null | undefined,
  balances: Balances,
  isWrapping: boolean,
) {
  const { independentField, typedValue } = useSwapState()

  const inputCurrency = balances[Field.INPUT]?.currency
  const outputCurrency = balances[Field.OUTPUT]?.currency

  const isExactIn: boolean = independentField === Field.INPUT
  const independentCurrency = isExactIn ? inputCurrency : outputCurrency
  const parsedAmount = tryParseAmount(typedValue, independentCurrency ?? undefined)

  return isWrapping
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }
}
