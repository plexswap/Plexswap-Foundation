import { Currency, CurrencyAmount, TradeType } from '@plexswap/sdk-core'
import { AbortControl } from '@plexswap/utils/abortControl'

import { BaseTradeConfig, Pool, Route, SmartRouterTrade } from '../../Ananke/types'
import { Graph } from './graph'

export type GasUseInfo = {
  gasUseEstimate: bigint
  gasUseEstimateBase: CurrencyAmount<Currency>
  gasUseEstimateQuote: CurrencyAmount<Currency>
  inputAmountWithGasAdjusted: CurrencyAmount<Currency>
  outputAmountWithGasAdjusted: CurrencyAmount<Currency>
}

export type AetherRoute = Omit<Route, 'g'> & GasUseInfo

export type TradeConfig = Omit<BaseTradeConfig, 'poolProvider' | 'allowedPoolTypes'> & {
  candidatePools: Pool[]
} & AbortControl

export type AetherTrade<TTradeType extends TradeType> = Omit<
  SmartRouterTrade<TTradeType>,
  'gasEstimateInUSD' | 'blockNumber' | 'routes' | 'gasEstimate'
> &
  GasUseInfo & {
    routes: AetherRoute[]
    graph: Graph
  }

export type AetherTradeWithoutGraph<TTradeType extends TradeType> = Omit<AetherTrade<TTradeType>, 'graph'>
