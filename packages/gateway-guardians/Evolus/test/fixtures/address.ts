import { ChainId } from '@plexswap/chains'
import { CurrencyAmount, ERC20Token, Pair, Percent } from '@plexswap/sdk-core'
import {
    POOL_DEPLOYER_ADDRESSES,
    FeeAmount,
    Pool,
    TICK_SPACINGS,
    TickMath,
    computePoolAddress,
    encodeSqrtRatioX96,
    nearestUsableTick,
} from '@plexswap/sdk-extended'
import { getEvolusRouterAddress } from './../../constants'
import { Provider } from './clients'
import { BUSD, USDC, USDT, USDP, WBNB } from './constants/tokens'
import { CorePool, ExtendedPool, PoolType, SmartRouter, StablePool } from './../../../Ananke'
import { getPermit2Address } from '@plexswap/hub-center/Licentia'

const fixtureTokensAddresses = (chainId: ChainId) => {
  return {
    USDC: USDC[chainId],
    USDT: USDT[chainId],
    USDP: USDP[chainId],
    BUSD: BUSD[chainId],
    WBNB: WBNB[chainId],
  }
}

export const getStablePool = async (
  tokenA: ERC20Token,
  tokenB: ERC20Token,
  provider: Provider,
  liquidity?: bigint,
): Promise<StablePool> => {
  const pools = await SmartRouter.getStableCandidatePools({
    currencyA: tokenA,
    currencyB: tokenB,
    onChainProvider: provider,
  })

  if (!pools.length) throw new ReferenceError(`No Stable Pool found with token ${tokenA.symbol}/${tokenB.symbol}`)
  const stablePool = pools[0] as StablePool

  if (liquidity) {
    stablePool.balances[0] = CurrencyAmount.fromRawAmount(stablePool.balances[0].currency, liquidity)
    stablePool.balances[1] = CurrencyAmount.fromRawAmount(stablePool.balances[1].currency, liquidity)
  }

  return stablePool
}

const getPair = (tokenA: ERC20Token, tokenB: ERC20Token, liquidity: bigint) => {
  // eslint-disable-next-line no-console
  console.assert(tokenA.chainId === tokenB.chainId, 'Invalid token pair')

  // @notice: to match off-chain testing ,we can use fixed liquid to match snapshots
  const reserve0 = liquidity
  const reserve1 = liquidity

  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

  return new Pair(CurrencyAmount.fromRawAmount(token0, reserve0), CurrencyAmount.fromRawAmount(token1, reserve1))
}

export const convertPoolToExtendedPool = (pool: Pool): ExtendedPool => {
  return {
    type: PoolType.EXTENDED,
    token0: pool.token0,
    token1: pool.token1,
    fee: pool.fee,
    sqrtRatioX96: pool.sqrtRatioX96,
    liquidity: pool.liquidity,
    tick: pool.tickCurrent,
    address: Pool.getAddress(pool.token0, pool.token1, pool.fee),
    token0ProtocolFee: new Percent(0, 100),
    token1ProtocolFee: new Percent(0, 100),
  }
}
export const convertPairToCorePool = (pair: Pair): CorePool => ({
  type: PoolType.CORE,
  reserve0: pair.reserve0,
  reserve1: pair.reserve1,
})

export const convertExtendedPoolToSDKPool = ({ token0, token1, fee, sqrtRatioX96, liquidity, tick, ticks }: ExtendedPool) =>
  new Pool(token0.wrapped, token1.wrapped, fee, sqrtRatioX96, liquidity, tick, ticks)
export const convertCorePoolToSDKPool = ({ reserve1, reserve0 }: CorePool) => new Pair(reserve0.wrapped, reserve1.wrapped)

const fixturePool = ({
  tokenA,
  tokenB,
  feeAmount = FeeAmount.MEDIUM,
  reserve,
}: {
  tokenA: ERC20Token
  tokenB: ERC20Token
  feeAmount: FeeAmount
  reserve:
    | {
        reserve0: bigint
        reserve1: bigint
      }
    | bigint
}) => {
  // eslint-disable-next-line no-console
  console.assert(tokenA.chainId === tokenB.chainId, 'Invalid token pair')

  const reserve0 = typeof reserve === 'bigint' ? reserve : reserve.reserve0
  const reserve1 = typeof reserve === 'bigint' ? reserve : reserve.reserve1
  const sqrtPriceX96 = encodeSqrtRatioX96(reserve0, reserve1)
  // fixture to full range liquidity
  const liquidity = BigInt(Math.floor(Math.sqrt(Number(reserve0 * reserve1))))

  return new Pool(tokenA, tokenB, feeAmount, sqrtPriceX96, liquidity, TickMath.getTickAtSqrtRatio(sqrtPriceX96), [
    {
      index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
      liquidityNet: liquidity,
      liquidityGross: liquidity,
    },
    {
      index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
      liquidityNet: -liquidity,
      liquidityGross: liquidity,
    },
  ])
}

export const fixtureAddresses = async (chainId: ChainId, liquidity: bigint) => {
  const tokens = fixtureTokensAddresses(chainId)
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const { USDC, USDT, WBNB } = tokens

  const corePairs = {
    WBNB_USDC_CORE: getPair(WBNB, USDC, liquidity),
    USDC_USDT_CORE: getPair(USDT, USDC, liquidity),
  }

  const extendedPools = {
    WBNB_USDC_EXTENDED_MEDIUM: fixturePool({
      tokenA: WBNB,
      tokenB: USDC,
      feeAmount: FeeAmount.MEDIUM,
      reserve: liquidity,
    }),
    USDC_USDT_EXTENDED_LOW: fixturePool({ tokenA: USDC, tokenB: USDT, feeAmount: FeeAmount.LOW, reserve: liquidity }),
    USDC_USDT_EXTENDED_LOW_ADDRESS: computePoolAddress({
      deployerAddress: POOL_DEPLOYER_ADDRESSES[chainId],
      tokenA: USDC,
      tokenB: USDT,
      fee: FeeAmount.LOW,
    }),
  }

  const UNIVERSAL_ROUTER = getEvolusRouterAddress(chainId)
  const PERMIT2 = getPermit2Address(chainId)

  return {
    ...tokens,
    ...corePairs,
    ...extendedPools,
    UNIVERSAL_ROUTER,
    PERMIT2,
  }
}
