import { TradeType } from '@plexswap/sdk-core'
import { SmartRouterTrade } from '@plexswap/gateway-guardians/Ananke'
import { useUserSlippage } from '@plexswap/utils/user'
import { useMemo } from 'react'
import { computeSlippageAdjustedAmounts } from '../utils/exchange'

export function useSlippageAdjustedAmounts(
  trade?: Pick<SmartRouterTrade<TradeType>, 'inputAmount' | 'outputAmount' | 'tradeType'> | null,
) {
  const [allowedSlippage] = useUserSlippage()
  return useMemo(() => computeSlippageAdjustedAmounts(trade, allowedSlippage), [allowedSlippage, trade])
}
