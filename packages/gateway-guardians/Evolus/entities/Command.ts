import { RoutePlanner } from '../utils/routerCommands'

export type TradeConfig = {
  allowRevert: boolean
}

export enum RouterTradeType {
  PlexswapTrade = 'PlexswapTrade',
  // NFTTrade = 'NFTTrade',
  UnwrapWETH = 'UnwrapWETH',
}

// interface for entities that can be encoded as a Evolus Router command
export interface Command {
  tradeType: RouterTradeType
  encode(planner: RoutePlanner, config: TradeConfig): void
}
