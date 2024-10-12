import { QuoteProvider, QuoterConfig, QuoterOptions, RouteType, RouteWithQuote, RouteWithoutQuote } from '../types'
import { isExtendedPool } from '../utils'
import { createOffChainQuoteProvider } from './offChainQuoteProvider'
import { createExtendedOnChainQuoteProvider, createMixedRouteOnChainQuoteProvider } from './onChainQuoteProvider'

// For evm
export function createQuoteProvider(config: QuoterConfig): QuoteProvider<QuoterConfig> {
  const { onChainProvider, multicallConfigs, gasLimit } = config
  const offChainQuoteProvider = createOffChainQuoteProvider()
  const mixedRouteOnChainQuoteProvider = createMixedRouteOnChainQuoteProvider({
    onChainProvider,
    multicallConfigs,
    gasLimit,
  })
  const extendedOnChainQuoteProvider = createExtendedOnChainQuoteProvider({ onChainProvider, multicallConfigs, gasLimit })

  const createGetRouteWithQuotes = (isExactIn = true) => {
    const getOffChainQuotes = isExactIn
      ? offChainQuoteProvider.getRouteWithQuotesExactIn
      : offChainQuoteProvider.getRouteWithQuotesExactOut
    const getMixedRouteQuotes = isExactIn
      ? mixedRouteOnChainQuoteProvider.getRouteWithQuotesExactIn
      : mixedRouteOnChainQuoteProvider.getRouteWithQuotesExactOut
    const getExtendedQuotes = isExactIn
      ? extendedOnChainQuoteProvider.getRouteWithQuotesExactIn
      : extendedOnChainQuoteProvider.getRouteWithQuotesExactOut

    return async function getRoutesWithQuotes(
      routes: RouteWithoutQuote[],
      { blockNumber, gasModel, signal }: QuoterOptions,
    ): Promise<RouteWithQuote[]> {
      const extendedSingleHopRoutes: RouteWithoutQuote[] = []
      const extendedMultihopRoutes: RouteWithoutQuote[] = []
      const mixedRoutesHaveExtendedPool: RouteWithoutQuote[] = []
      const routesCanQuoteOffChain: RouteWithoutQuote[] = []
      for (const route of routes) {
        if (route.type === RouteType.CORE || route.type === RouteType.STABLE) {
          routesCanQuoteOffChain.push(route)
          continue
        }
        if (route.type === RouteType.EXTENDED) {
          if (route.pools.length === 1) {
            extendedSingleHopRoutes.push(route)
            continue
          }
          extendedMultihopRoutes.push(route)
          continue
        }
        const { pools } = route
        if (pools.some((pool) => isExtendedPool(pool))) {
          mixedRoutesHaveExtendedPool.push(route)
          continue
        }
        routesCanQuoteOffChain.push(route)
      }

      const results = await Promise.allSettled([
        getOffChainQuotes(routesCanQuoteOffChain, { blockNumber, gasModel, signal }),
        getMixedRouteQuotes(mixedRoutesHaveExtendedPool, { blockNumber, gasModel, retry: { retries: 0 }, signal }),
        getExtendedQuotes(extendedSingleHopRoutes, { blockNumber, gasModel, signal }),
        getExtendedQuotes(extendedMultihopRoutes, { blockNumber, gasModel, retry: { retries: 1 }, signal }),
      ])
      if (results.every((result) => result.status === 'rejected')) {
        throw new Error(results.map((result) => (result as PromiseRejectedResult).reason).join(','))
      }
      return results
        .filter((result): result is PromiseFulfilledResult<RouteWithQuote[]> => result.status === 'fulfilled')
        .reduce<RouteWithQuote[]>((acc, cur) => [...acc, ...cur.value], [])
    }
  }

  return {
    getRouteWithQuotesExactIn: createGetRouteWithQuotes(true),
    getRouteWithQuotesExactOut: createGetRouteWithQuotes(false),
    getConfig: () => config,
  }
}
