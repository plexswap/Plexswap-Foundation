import { TradeType } from '@plexswap/sdk-core'
import tryParseAmount from '@plexswap/utils/tryParseAmount'
import { useUserSingleHopOnly } from '@plexswap/utils/user'

import { useCurrency } from 'hooks/Tokens'
import { useBestAMMTrade } from 'hooks/useBestAMMTrade'
import { useDeferredValue, useMemo } from 'react'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import {
    useUserExtendedSwapEnable,
    useUserSplitRouteEnable,
    useUserStableSwapEnable,
    useUserCoreSwapEnable,
} from 'state/user/smartRouter'

interface Options {
  maxHops?: number
}

export function useSwapBestTrade({ maxHops }: Options = {}) {
  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
  } = useSwapState()
  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const isExactIn = independentField === Field.INPUT
  const independentCurrency = isExactIn ? inputCurrency : outputCurrency
  const dependentCurrency = isExactIn ? outputCurrency : inputCurrency
  const tradeType = isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
  const amount = tryParseAmount(typedValue, independentCurrency ?? undefined)

  const [singleHopOnly] = useUserSingleHopOnly()
  const [split] = useUserSplitRouteEnable()
  const [coreSwap] = useUserCoreSwapEnable()
  const [extendedSwap] = useUserExtendedSwapEnable()
  const [stableSwap] = useUserStableSwapEnable()
  // stable swap only support exact in
  const stableSwapEnable = useMemo(() => {
    return stableSwap && isExactIn
  }, [stableSwap, isExactIn])

  const { isLoading, trade, refresh, syncing, isStale, error } = useBestAMMTrade({
    amount,
    currency: dependentCurrency,
    baseCurrency: independentCurrency,
    tradeType,
    maxHops: singleHopOnly ? 1 : maxHops,
    maxSplits: split ? undefined : 0,
    coreSwap,
    extendedSwap,
    stableSwap: stableSwapEnable,
    type: 'auto',
    trackPerf: true,
  })

  return {
    refresh,
    syncing,
    isStale,
    error,
    isLoading: useDeferredValue(Boolean(isLoading || (typedValue && !trade && !error))),
    trade: typedValue ? trade : undefined,
  }
}
