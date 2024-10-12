import { Currency, CurrencyAmount, TradeType } from '@plexswap/sdk-core'
import { formatFraction } from '@plexswap/utils/formatFractions'

import { getPriceImpact } from '../Ananke/utils/getPriceImpact'
import { findBestTrade } from './graph'
import { TradeConfig, AetherTrade } from './types'
import { getBetterTrade } from './utils'

const DEFAULT_STREAM = 10

function getBestStreamsConfig(trade?: AetherTrade<TradeType>) {
  const maxStreams = 100
  if (!trade) {
    return DEFAULT_STREAM
  }
  const priceImpact = getPriceImpact(trade)
  if (!priceImpact) {
    return DEFAULT_STREAM
  }
  const { gasUseEstimateBase, inputAmount, outputAmount } = trade
  if (!gasUseEstimateBase) {
    return DEFAULT_STREAM
  }
  const amount = trade.tradeType === TradeType.EXACT_INPUT ? inputAmount : outputAmount

  const bestFlowAmount = Math.sqrt(
    (Number(gasUseEstimateBase.toExact()) * Number(amount.toExact())) / Number(formatFraction(priceImpact.asFraction)),
  )
  const streams = Math.round(Number(amount.toExact()) / bestFlowAmount)
  if (!Number.isFinite(streams)) {
    return DEFAULT_STREAM
  }
  return Math.max(1, Math.min(streams, maxStreams))
}

export async function getBestTrade(
  amount: CurrencyAmount<Currency>,
  quoteCurrency: Currency,
  tradeType: TradeType,
  { candidatePools, gasPriceWei, maxHops, maxSplits }: TradeConfig,
): Promise<AetherTrade<TradeType> | undefined> {
  // NOTE: there's no max split cap right now. This option is only used to control the on/off of multiple splits
  const splitDisabled = maxSplits !== undefined && maxSplits === 0

  let bestTrade: AetherTrade<TradeType> | undefined
  try {
    bestTrade = await findBestTrade({
      tradeType,
      amount,
      quoteCurrency,
      gasPriceWei,
      candidatePools,
      maxHops,
      streams: 1,
    })
  } catch (e) {
    if (splitDisabled) {
      throw e
    }
    bestTrade = await findBestTrade({
      tradeType,
      amount,
      quoteCurrency,
      gasPriceWei,
      candidatePools,
      maxHops,
      streams: DEFAULT_STREAM,
    })
  }

  if (splitDisabled) {
    return bestTrade
  }
  const streams = getBestStreamsConfig(bestTrade)
  if (streams === 1) {
    return bestTrade
  }
  const bestTradeWithStreams = await findBestTrade({
    tradeType,
    amount,
    quoteCurrency,
    gasPriceWei,
    candidatePools,
    maxHops,
    streams,
  })

  return getBetterTrade(bestTrade, bestTradeWithStreams)
}
