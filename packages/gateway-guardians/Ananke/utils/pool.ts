import { Currency, Pair, Price } from '@plexswap/sdk-core'
import tryParseAmount from '@plexswap/utils/tryParseAmount'
import { Pool as SDKExtendedPool, computePoolAddress } from '@plexswap/sdk-extended'
import memoize from 'lodash/memoize.js'
import { Address } from 'viem'
import { getSwapOutput } from '@plexswap/hub-center/Aegis'

import { ExtendedPool, Pool, PoolType, StablePool, CorePool } from '../types'

export function isCorePool(pool: Pool): pool is CorePool {
  return pool.type === PoolType.CORE
}

export function isExtendedPool(pool: Pool): pool is ExtendedPool {
  return pool.type === PoolType.EXTENDED
}

export function isStablePool(pool: Pool): pool is StablePool {
  return pool.type === PoolType.STABLE && pool.balances.length >= 2
}

export function involvesCurrency(pool: Pool, currency: Currency) {
  const token = currency.wrapped
  if (isCorePool(pool)) {
    const { reserve0, reserve1 } = pool
    return reserve0.currency.equals(token) || reserve1.currency.equals(token)
  }
  if (isExtendedPool(pool)) {
    const { token0, token1 } = pool
    return token0.equals(token) || token1.equals(token)
  }
  if (isStablePool(pool)) {
    const { balances } = pool
    return balances.some((b) => b.currency.equals(token))
  }
  return false
}

// FIXME current version is not working with stable pools that have more than 2 tokens
export function getOutputCurrency(pool: Pool, currencyIn: Currency): Currency {
  const tokenIn = currencyIn.wrapped
  if (isCorePool(pool)) {
    const { reserve0, reserve1 } = pool
    return reserve0.currency.equals(tokenIn) ? reserve1.currency : reserve0.currency
  }
  if (isExtendedPool(pool)) {
    const { token0, token1 } = pool
    return token0.equals(tokenIn) ? token1 : token0
  }
  if (isStablePool(pool)) {
    const { balances } = pool
    return balances[0].currency.equals(tokenIn) ? balances[1].currency : balances[0].currency
  }
  throw new Error('Cannot get output currency by invalid pool')
}

export const computeExtendedPoolAddress = memoize(
  computePoolAddress,
  ({ deployerAddress, tokenA, tokenB, fee }) =>
    `${tokenA.chainId}_${deployerAddress}_${tokenA.address}_${tokenB.address}_${fee}`,
)

export const computeCorePoolAddress = memoize(
  Pair.getAddress,
  (tokenA, tokenB) => `${tokenA.chainId}_${tokenA.address}_${tokenB.address}`,
)

export const getPoolAddress = memoize(
  function getAddress(pool: Pool): Address | '' {
    if (isStablePool(pool) || isExtendedPool(pool)) {
      return pool.address
    }
    if (isCorePool(pool)) {
      const { reserve0, reserve1 } = pool
      return computeCorePoolAddress(reserve0.currency.wrapped, reserve1.currency.wrapped)
    }
    return ''
  },
  (pool) => {
    if (isStablePool(pool)) {
      const { balances } = pool
      const tokenAddresses = balances.map((b) => b.currency.wrapped.address)
      return `${pool.type}_${balances[0]?.currency.chainId}_${tokenAddresses.join('_')}`
    }
    const [token0, token1] = isCorePool(pool)
      ? [pool.reserve0.currency.wrapped, pool.reserve1.currency.wrapped]
      : [pool.token0.wrapped, pool.token1.wrapped]
    const fee = isExtendedPool(pool) ? pool.fee : 'CORE_FEE'
    return `${pool.type}_${token0.chainId}_${token0.address}_${token1.address}_${fee}`
  },
)

export function getTokenPrice(pool: Pool, base: Currency, quote: Currency): Price<Currency, Currency> {
  if (isExtendedPool(pool)) {
    const { token0, token1, fee, liquidity, sqrtRatioX96, tick } = pool
    const extendedPool = new SDKExtendedPool(token0.wrapped, token1.wrapped, fee, sqrtRatioX96, liquidity, tick)
    return extendedPool.priceOf(base.wrapped)
  }

  if (isCorePool(pool)) {
    const pair = new Pair(pool.reserve0.wrapped, pool.reserve1.wrapped)
    return pair.priceOf(base.wrapped)
  }

  // FIXME now assume price of stable pair is 1
  if (isStablePool(pool)) {
    const { amplifier, balances, fee } = pool
    const baseIn = tryParseAmount('1', base)
    if (!baseIn) {
      throw new Error(`Cannot parse amount for ${base.symbol}`)
    }
    const quoteOut = getSwapOutput({
      amplifier,
      balances,
      fee,
      outputCurrency: quote,
      amount: baseIn,
    })

    return new Price({
      baseAmount: baseIn,
      quoteAmount: quoteOut,
    })
  }
  return new Price(base, quote, 1n, 0n)
}
