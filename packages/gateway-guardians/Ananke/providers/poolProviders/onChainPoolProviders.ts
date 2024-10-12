import { ChainId } from '@plexswap/chains'
import { deserializeToken } from '@plexswap/metalists'
import { BigintIsh, Currency, CurrencyAmount, Percent } from '@plexswap/sdk-core'
import { Abi, Address, erc20Abi } from 'viem'
import { plexPairABI } from './../../../config/abis/PlexswapPair'
import { stableSwapPairABI } from './../../../config/abis/StableSwapPair'
import { POOL_DEPLOYER_ADDRESSES, FeeAmount, parseProtocolFees, plexswapExtendedPoolABI } from '@plexswap/sdk-extended'
import { getStableSwapPools } from '@plexswap/hub-center/Aegis'
import { ExtendedPool, CorePool, OnChainProvider, Pool, PoolType, StablePool } from '../../types'
import { computeExtendedPoolAddress, computeCorePoolAddress } from '../../utils'
import { ExtendedPoolMeta, PoolMeta } from './internalTypes'

export const getCorePoolsOnChain = createOnChainPoolFactory<CorePool, PoolMeta>({
  abi: plexPairABI,
  getPossiblePoolMetas: ([currencyA, currencyB]) => [
    { address: computeCorePoolAddress(currencyA.wrapped, currencyB.wrapped), currencyA, currencyB },
  ],
  buildPoolInfoCalls: ({ address }) => [
    {
      address,
      functionName: 'getReserves',
      args: [],
    },
  ],
  buildPool: ({ currencyA, currencyB }, [reserves]) => {
    if (!reserves) {
      return null
    }
    const [reserve0, reserve1] = reserves
    const [token0, token1] = currencyA.wrapped.sortsBefore(currencyB.wrapped)
      ? [currencyA, currencyB]
      : [currencyB, currencyA]
    return {
      type: PoolType.CORE,
      reserve0: CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
      reserve1: CurrencyAmount.fromRawAmount(token1, reserve1.toString()),
    }
  },
})

export const getStablePoolsOnChain = createOnChainPoolFactory<StablePool, PoolMeta>({
  abi: stableSwapPairABI,
  getPossiblePoolMetas: ([currencyA, currencyB]) => {
    const poolConfigs = getStableSwapPools(currencyA.chainId)
    return poolConfigs
      .filter(({ token, quoteToken }) => {
        const tokenA = deserializeToken(token)
        const tokenB = deserializeToken(quoteToken)
        return (
          (tokenA.equals(currencyA.wrapped) && tokenB.equals(currencyB.wrapped)) ||
          (tokenA.equals(currencyB.wrapped) && tokenB.equals(currencyA.wrapped))
        )
      })
      .map(({ stableSwapAddress }) => ({
        address: stableSwapAddress,
        currencyA,
        currencyB,
      }))
  },
  buildPoolInfoCalls: ({ address }) => [
    {
      address,
      functionName: 'balances',
      args: [0],
    },
    {
      address,
      functionName: 'balances',
      args: [1],
    },
    {
      address,
      functionName: 'A',
      args: [],
    },
    {
      address,
      functionName: 'fee',
      args: [],
    },
    {
      address,
      functionName: 'FEE_DENOMINATOR',
      args: [],
    },
  ],
  buildPool: ({ currencyA, currencyB, address }, [balance0, balance1, a, fee, feeDenominator]) => {
    if (!balance0 || !balance1 || !a || !fee || !feeDenominator) {
      return null
    }
    const [token0, token1] = currencyA.wrapped.sortsBefore(currencyB.wrapped)
      ? [currencyA, currencyB]
      : [currencyB, currencyA]
    return {
      address,
      type: PoolType.STABLE,
      balances: [
        CurrencyAmount.fromRawAmount(token0, balance0.toString()),
        CurrencyAmount.fromRawAmount(token1, balance1.toString()),
      ],
      amplifier: BigInt(a.toString()),
      fee: new Percent(BigInt(fee.toString()), BigInt(feeDenominator.toString())),
    }
  },
})

export const getExtendedPoolsWithoutTicksOnChain = createOnChainPoolFactory<ExtendedPool, ExtendedPoolMeta>({
  abi: plexswapExtendedPoolABI,
  getPossiblePoolMetas: ([currencyA, currencyB]) => {
    const deployerAddress = POOL_DEPLOYER_ADDRESSES[currencyA.chainId as ChainId]
    if (!deployerAddress) {
      return []
    }
    return [FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH].map((fee) => ({
      address: computeExtendedPoolAddress({
        deployerAddress,
        tokenA: currencyA.wrapped,
        tokenB: currencyB.wrapped,
        fee,
      }),
      currencyA,
      currencyB,
      fee,
    }))
  },
  buildPoolInfoCalls: ({ address, currencyA, currencyB }) => [
    {
      address,
      functionName: 'liquidity',
    },
    {
      address,
      functionName: 'slot0',
    },
    {
      abi: erc20Abi,
      address: currencyA.wrapped.address,
      functionName: 'balanceOf',
      args: [address],
    },
    {
      abi: erc20Abi,
      address: currencyB.wrapped.address,
      functionName: 'balanceOf',
      args: [address],
    },
  ],
  buildPool: ({ currencyA, currencyB, fee, address }, [liquidity, slot0, balanceA, balanceB]) => {
    if (!slot0) {
      return null
    }
    const [sqrtPriceX96, tick, , , , feeProtocol] = slot0
    const sorted = currencyA.wrapped.sortsBefore(currencyB.wrapped)
    const [balance0, balance1] = sorted ? [balanceA, balanceB] : [balanceB, balanceA]
    const [token0, token1] = sorted ? [currencyA, currencyB] : [currencyB, currencyA]
    const [token0ProtocolFee, token1ProtocolFee] = parseProtocolFees(feeProtocol)
    return {
      type: PoolType.EXTENDED,
      token0,
      token1,
      reserve0: CurrencyAmount.fromRawAmount(token0, balance0),
      reserve1: CurrencyAmount.fromRawAmount(token1, balance1),
      fee,
      liquidity: BigInt(liquidity.toString()),
      sqrtRatioX96: BigInt(sqrtPriceX96.toString()),
      tick: Number(tick),
      address,
      token0ProtocolFee,
      token1ProtocolFee,
    }
  },
})

// maybe add back strict type later
type ContractFunctionConfig = {
  abi?: Abi
  address: Address
  functionName: string
  args?: any[]
}

interface OnChainPoolFactoryParams<TPool extends Pool, TPoolMeta extends PoolMeta, TAbi extends Abi | unknown[] = Abi> {
  abi: TAbi
  getPossiblePoolMetas: (pair: [Currency, Currency]) => TPoolMeta[]
  buildPoolInfoCalls: (poolMeta: TPoolMeta) => ContractFunctionConfig[]
  buildPool: (poolMeta: TPoolMeta, data: any[]) => TPool | null
}

function createOnChainPoolFactory<
  TPool extends Pool,
  TPoolMeta extends PoolMeta = PoolMeta,
  TAbi extends Abi | unknown[] = Abi,
>({ abi, getPossiblePoolMetas, buildPoolInfoCalls, buildPool }: OnChainPoolFactoryParams<TPool, TPoolMeta, TAbi>) {
  return async function poolFactory(
    pairs: [Currency, Currency][],
    provider?: OnChainProvider,
    _blockNumber?: BigintIsh,
  ): Promise<TPool[]> {
    if (!provider) {
      throw new Error('No valid onchain data provider')
    }

    const chainId: ChainId = pairs[0]?.[0]?.chainId
    const client = provider({ chainId })
    if (!chainId || !client) {
      return []
    }

    const poolAddressSet = new Set<string>()

    const poolMetas: TPoolMeta[] = []
    for (const pair of pairs) {
      const possiblePoolMetas = getPossiblePoolMetas(pair)
      for (const meta of possiblePoolMetas) {
        if (!poolAddressSet.has(meta.address)) {
          poolMetas.push(meta)
          poolAddressSet.add(meta.address)
        }
      }
    }

    let calls: ContractFunctionConfig[] = []
    let poolCallSize = 0
    for (const meta of poolMetas) {
      const poolCalls = buildPoolInfoCalls(meta)
      if (!poolCallSize) {
        poolCallSize = poolCalls.length
      }
      if (!poolCallSize || poolCallSize !== poolCalls.length) {
        throw new Error('Inconsistent pool data call')
      }
      calls = [...calls, ...poolCalls]
    }

    if (!calls.length) {
      return []
    }

    const results = await client.multicall({
      contracts: calls.map((call) => ({
        abi: call.abi || (abi as any),
        address: call.address as `0x${string}`,
        functionName: call.functionName,
        args: call.args as any,
      })),
      allowFailure: true,
    })

    const pools: TPool[] = []
    for (let i = 0; i < poolMetas.length; i += 1) {
      const poolResults = results.slice(i * poolCallSize, (i + 1) * poolCallSize)
      const pool = buildPool(
        poolMetas[i],
        poolResults.map((result) => result.result),
      )
      if (pool) {
        pools.push(pool)
      }
    }
    return pools
  }
}