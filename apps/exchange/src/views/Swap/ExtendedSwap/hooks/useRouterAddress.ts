import { TradeType } from '@plexswap/sdk-core'
import { RouteType, SmartRouterTrade } from '@plexswap/gateway-guardians/Ananke'
import { ROUTER_ADDRESS, SMART_ROUTER_ADDRESSES } from '@plexswap/gateway-guardians/config'

export function useRouterAddress(trade?: SmartRouterTrade<TradeType>) {
  if (!trade) {
    return ''
  }

  const { routes, inputAmount } = trade
  const {
    currency: { chainId },
  } = inputAmount
  if (routes.length === 1 && routes[0].type === RouteType.CORE) {
    return ROUTER_ADDRESS[chainId]
  }
  return SMART_ROUTER_ADDRESSES[chainId]
}

