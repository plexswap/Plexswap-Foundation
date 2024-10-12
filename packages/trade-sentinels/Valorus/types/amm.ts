import { TradeType } from '@plexswap/sdk-core'
import { PoolType, SmartRouter, AetherRouter } from '@plexswap/gateway-guardians'

import { OrderType } from './orderType'

type LastInUnion<U> = UnionToIntersection<U extends unknown ? (x: U) => 0 : never> extends (x: infer l) => 0 ? l : never
type UnionToIntersection<union> = (union extends unknown ? (arg: union) => 0 : never) extends (arg: infer i) => 0
  ? i
  : never

export type UnionToTuple<
  union,
  ///
  last = LastInUnion<union>,
> = [union] extends [never] ? [] : [...UnionToTuple<Exclude<union, last>>, last]

export type TradeTypeKey = keyof typeof TradeType

export type PoolTypeKey = keyof typeof PoolType

export type TradeTypeKeys = UnionToTuple<TradeTypeKey>

export type PoolTypeKeys = UnionToTuple<PoolTypeKey>

export type AMMOrder = AetherRouter.Transformer.SerializedAetherTrade & {
  quoteGasAdjusted: SmartRouter.Transformer.SerializedCurrencyAmount
  gasUseEstimateUSD: string
}

export type AMMRequestConfig = {
  protocols: ('CORE' | 'EXTENDED' | 'STABLE')[]
  routingType: OrderType.PCS_CLASSIC
  gasPriceWei?: string
  maxHops?: number
  maxSplits?: number
}
