import { Currency, CurrencyAmount, Pair, ZERO } from '@plexswap/sdk-core'
import { Pool as ExtendedPool, TickList } from '@plexswap/sdk-extended'
import { getQuoteExactIn, getQuoteExactOut } from '@plexswap/hub-center/Aegis'
import {
    ExtendedPool as IExtendedPool,
    Pool as IPool,
    Pool,
    QuoteProvider,
    QuoterOptions,
    RouteWithQuote,
    RouteWithoutQuote,
    StablePool,
    CorePool,
} from '../types'
import { getOutputCurrency, isExtendedPool, isStablePool, isCorePool } from '../utils'

export function createOffChainQuoteProvider(): QuoteProvider {
  const createGetRoutesWithQuotes = (isExactIn = true) => {
    const getCoreQuote = createGetCoreQuote(isExactIn)
    const getStableQuote = createGetStableQuote(isExactIn)
    const getExtendedQuote = createGetExtendedQuote(isExactIn)
    function* each(pools: IPool[]) {
      let i = isExactIn ? 0 : pools.length - 1
      const hasNext = () => (isExactIn ? i < pools.length : i >= 0)
      while (hasNext()) {
        yield [pools[i], i] as [Pool, number]
        if (isExactIn) {
          i += 1
        } else {
          i -= 1
        }
      }
    }
    const adjustQuoteForGas = (quote: CurrencyAmount<Currency>, gasCostInToken: CurrencyAmount<Currency>) => {
      if (isExactIn) {
        return quote.subtract(gasCostInToken)
      }
      return quote.add(gasCostInToken)
    }

    return async function getRoutesWithQuotes(
      routes: RouteWithoutQuote[],
      { gasModel }: QuoterOptions,
    ): Promise<RouteWithQuote[]> {
      const routesWithQuote: RouteWithQuote[] = []
      for (const route of routes) {
        try {
          const { pools, amount } = route
          let quote = amount
          const initializedTickCrossedList = Array(pools.length).fill(0)
          let quoteSuccess = true
          for (const [pool, i] of each(pools)) {
            if (isCorePool(pool)) {
              ;[quote] = getCoreQuote(pool, quote)
              continue
            }
            if (isStablePool(pool)) {
              ;[quote] = getStableQuote(pool, quote)
              continue
            }
            if (isExtendedPool(pool)) {
              // It's ok to await in loop because we only get quote from extended pools who have local ticks data as tick provider
              // eslint-disable-next-line no-await-in-loop
              const extendedQuoteResult = await getExtendedQuote(pool, quote)
              if (!extendedQuoteResult || extendedQuoteResult.quote.quotient === ZERO) {
                quoteSuccess = false
                break
              }
              const { quote: extendedQuote, numOfTicksCrossed } = extendedQuoteResult
              quote = extendedQuote
              initializedTickCrossedList[i] = numOfTicksCrossed
            }
          }
          if (!quoteSuccess) {
            continue
          }

          const { gasEstimate, gasCostInUSD, gasCostInToken } = gasModel.estimateGasCost(
            {
              ...route,
              quote,
            },
            { initializedTickCrossedList },
          )
          routesWithQuote.push({
            ...route,
            quote,
            quoteAdjustedForGas: adjustQuoteForGas(quote, gasCostInToken),
            gasEstimate,
            gasCostInUSD,
            gasCostInToken,
          })
        } catch (e) {
          // console.warn('Failed to get quote from route', route, e)
        }
      }
      return routesWithQuote
    }
  }

  return {
    getRouteWithQuotesExactIn: createGetRoutesWithQuotes(true),
    getRouteWithQuotesExactOut: createGetRoutesWithQuotes(false),
  }
}

function createGetCoreQuote(isExactIn = true) {
  return function getCoreQuote(p: CorePool, amount: CurrencyAmount<Currency>): [CurrencyAmount<Currency>, CorePool] {
    const { reserve0, reserve1 } = p
    const pair = new Pair(reserve0.wrapped, reserve1.wrapped)
    const [quote, newPair] = isExactIn ? pair.getOutputAmount(amount.wrapped) : pair.getInputAmount(amount.wrapped)
    const newPool: CorePool = { ...p, reserve0: newPair.reserve0, reserve1: newPair.reserve1 }
    return [quote, newPool]
  }
}

function createGetStableQuote(isExactIn = true) {
  const getQuote = isExactIn ? getQuoteExactIn : getQuoteExactOut
  return function getStableQuote(
    pool: StablePool,
    amount: CurrencyAmount<Currency>,
  ): [CurrencyAmount<Currency>, StablePool] {
    const { amplifier, balances, fee } = pool
    const [quote, { balances: newBalances }] = getQuote({
      amount,
      balances,
      amplifier,
      outputCurrency: getOutputCurrency(pool, amount.currency),
      fee,
    })
    return [quote, { ...pool, balances: newBalances }]
  }
}

function createGetExtendedQuote(isExactIn = true) {
  return async function getExtendedQuote(
    pool: IExtendedPool,
    amount: CurrencyAmount<Currency>,
  ): Promise<{ quote: CurrencyAmount<Currency>; numOfTicksCrossed: number; pool: IExtendedPool } | null> {
    const { token0, token1, fee, sqrtRatioX96, liquidity, ticks, tick } = pool
    if (!ticks?.length) {
      return null
    }
    try {
      const extendedPool = new ExtendedPool(token0.wrapped, token1.wrapped, fee, sqrtRatioX96, liquidity, tick, ticks)
      const [quote, poolAfter] = isExactIn
        ? await extendedPool.getOutputAmount(amount.wrapped)
        : await extendedPool.getInputAmountByExactOut(amount.wrapped)

      // Not enough liquidity to perform the swap
      if (quote.quotient <= 0n) {
        return null
      }

      const { tickCurrent: tickAfter } = poolAfter
      const newPool: IExtendedPool = {
        ...pool,
        tick: tickAfter,
        sqrtRatioX96: poolAfter.sqrtRatioX96,
        liquidity: poolAfter.liquidity,
      }
      const numOfTicksCrossed = TickList.countInitializedTicksCrossed(ticks, tick, tickAfter)
      return {
        quote,
        numOfTicksCrossed,
        pool: newPool,
      }
    } catch (e) {
      // console.warn('No enough liquidity to perform swap', e)
      return null
    }
  }
}

export type PoolQuote = {
  pool: Pool
  quote: CurrencyAmount<Currency>
  poolAfter: Pool
}

export function createPoolQuoteGetter(isExactIn = true) {
  const getCoreQuote = createGetCoreQuote(isExactIn)
  const getStableQuote = createGetStableQuote(isExactIn)
  const getExtendedQuote = createGetExtendedQuote(isExactIn)

  return async function getPoolQuote(pool: Pool, amount: CurrencyAmount<Currency>): Promise<PoolQuote | undefined> {
    if (isCorePool(pool)) {
      const [quote, newPool] = getCoreQuote(pool, amount)
      return { quote, pool, poolAfter: newPool }
    }
    if (isExtendedPool(pool)) {
      const quote = await getExtendedQuote(pool, amount)
      return quote ? { quote: quote.quote, pool, poolAfter: quote.pool } : undefined
    }
    if (isStablePool(pool)) {
      const [quote, newPool] = getStableQuote(pool, amount)
      return { quote, pool, poolAfter: newPool }
    }
    return undefined
  }
}