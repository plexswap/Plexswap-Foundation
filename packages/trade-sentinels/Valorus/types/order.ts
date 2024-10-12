import type { ExclusiveDutchOrderInfoJSON, ExclusiveDutchOrderTrade } from './../../Hermes'
import type { Currency, TradeType } from '@plexswap/sdk-core'
import type { AetherRouter } from '@plexswap/gateway-guardians'
import type { AMMOrder } from './amm'
import { Hex } from './common'
import { OrderType } from './orderType'

export type Order =
  | {
      type: OrderType.DUTCH_LIMIT
      order: {
        auctionPeriodSecs: number
        deadlineBufferSecs: number
        orderInfo: ExclusiveDutchOrderInfoJSON
        encodedOrder: Hex
        permitData: any // TODO: add permit data type
        quoteId: string
        requestId: string
        slippageTolerance: string
        startTimeBufferSecs: number
      }
    }
  | {
      type: OrderType.PCS_CLASSIC
      order: AMMOrder
    }

export type XOrder<
  input extends Currency = Currency,
  output extends Currency = Currency,
  tradeType extends TradeType = TradeType,
> = {
  type: OrderType.DUTCH_LIMIT
  trade: ExclusiveDutchOrderTrade<input, output>
  ammTrade?: AetherRouter.AetherTradeWithoutGraph<tradeType>
}

export type ClassicOrder<tradeType extends TradeType = TradeType> = {
  type: OrderType.PCS_CLASSIC
  trade: AetherRouter.AetherTradeWithoutGraph<tradeType>
}

export type PriceOrder<
  input extends Currency = Currency,
  output extends Currency = Currency,
  tradeType extends TradeType = TradeType,
> = ClassicOrder<tradeType> | XOrder<input, output, tradeType>
