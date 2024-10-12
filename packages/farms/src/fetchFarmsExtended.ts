import { ChainId } from '@plexswap/chains'
import { Currency, ERC20Token } from '@plexswap/sdk-core'
import { WAYA } from '@plexswap/tokens'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { tickToPrice } from '@plexswap/sdk-extended'
import BN from 'bignumber.js'
import chunk from 'lodash/chunk'
import { Address, PublicClient, formatUnits, getAddress } from 'viem'

import { getCurrencyListUsdPrice } from '@plexswap/trade-sentinels/Valorus'
import { DEFAULT_COMMON_PRICE, PriceHelper } from '../config/common'
import { getFarmApr } from './apr'
import { TFarmExtendedSupportedChainId, extendedFarmSupportedChainId } from './constants'
import { ComputedFarmConfigExtended, FarmExtendedData, FarmExtendedDataWithPrice } from './types'

const chainlinkAbi = [
  {
    inputs: [],
    name: 'latestAnswer',
    outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export async function farmExtendedFetchFarms({
  farms,
  provider,
  chiefFarmerAddress,
  chainId,
  totalAllocPoint,
  commonPrice,
}: {
  farms: ComputedFarmConfigExtended[]
  provider: ({ chainId }: { chainId: number }) => PublicClient
  chiefFarmerAddress: Address
  chainId: number
  totalAllocPoint: bigint
  commonPrice: CommonPrice
}) {
  const [poolInfos, wayaPrice, extendedPoolData] = await Promise.all([
    fetchPoolInfos(farms, chainId, provider, chiefFarmerAddress),
    provider({ chainId: ChainId.BSC })
      .readContract({
        abi: chainlinkAbi,
        address: '0xB6064eD41d4f67e353768aA239cA86f4F73665a1',
        functionName: 'latestAnswer',
      })
      .then((res) => formatUnits(res, 8)),
    fetchExtendedPools(farms, chainId, provider),
  ])

  const lmPoolInfos = await fetchLmPools(
    extendedPoolData.map((extendedPool) => (extendedPool[1] ? extendedPool[1] : null)).filter(Boolean) as Address[],
    chainId,
    provider,
  )

  const farmsData = farms
    .map((farm, index) => {
      const { token, quoteToken, ...f } = farm
      if (!extendedPoolData[index][1]) {
        return null
      }
      const lmPoolAddress = extendedPoolData[index][1]
      return {
        ...f,
        token,
        quoteToken,
        lmPool: lmPoolAddress,
        lmPoolLiquidity: lmPoolInfos[lmPoolAddress].liquidity,
        _rewardGrowthGlobalX128: lmPoolInfos[lmPoolAddress].rewardGrowthGlobalX128,
        ...getExtendedFarmsDynamicData({
          tick: extendedPoolData[index][0][1],
          token0: farm.token,
          token1: farm.quoteToken,
        }),
        ...getFarmAllocation({
          allocPoint: poolInfos[index]?.[0],
          totalAllocPoint,
        }),
      }
    })
    .filter(Boolean) as FarmExtendedData[]

  const defaultCommonPrice: CommonPrice = extendedFarmSupportedChainId.includes(chainId)
    ? DEFAULT_COMMON_PRICE[chainId as TFarmExtendedSupportedChainId]
    : {}
  const combinedCommonPrice: CommonPrice = {
    ...defaultCommonPrice,
    ...commonPrice,
  }

  const farmsWithPrice = getFarmsPrices(farmsData, wayaPrice, combinedCommonPrice)

  return farmsWithPrice
}

const chieffarmerExtendedAbi = [
  {
    inputs: [],
    name: 'latestPeriodWayaPerSecond',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'poolInfo',
    outputs: [
      { internalType: 'uint256', name: 'allocPoint', type: 'uint256' },
      { internalType: 'contract IPlexswapExtendedPool', name: 'extendedPool', type: 'address' },
      { internalType: 'address', name: 'token0', type: 'address' },
      { internalType: 'address', name: 'token1', type: 'address' },
      { internalType: 'uint24', name: 'fee', type: 'uint24' },
      { internalType: 'uint256', name: 'totalLiquidity', type: 'uint256' },
      { internalType: 'uint256', name: 'totalBoostLiquidity', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'poolLength',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAllocPoint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export async function fetchChiefFarmerExtendedData({
  provider,
  chiefFarmerAddress,
  chainId,
}: {
  provider: ({ chainId }: { chainId: number }) => PublicClient
  chiefFarmerAddress: Address
  chainId: number
}): Promise<{
  poolLength: bigint
  totalAllocPoint: bigint
  latestPeriodWayaPerSecond: bigint
}> {
  const [poolLength, totalAllocPoint, latestPeriodWayaPerSecond] = await provider({ chainId }).multicall({
    contracts: [
      {
        address: chiefFarmerAddress,
        abi: chieffarmerExtendedAbi,
        functionName: 'poolLength',
      },
      {
        address: chiefFarmerAddress,
        abi: chieffarmerExtendedAbi,
        functionName: 'totalAllocPoint',
      },
      {
        address: chiefFarmerAddress,
        abi: chieffarmerExtendedAbi,
        functionName: 'latestPeriodWayaPerSecond',
      },
    ],
    allowFailure: false,
  })

  return {
    poolLength,
    totalAllocPoint,
    latestPeriodWayaPerSecond,
  }
}

/**
 *
 * @returns
 * ```
   {
    // allocPoint: BigNumber
    0: bigint
    // extendedPool: string
    1: Address
    // token0: string
    2: Address
    // token1: string
    3: Address
    // fee: number
    4: number
    // totalLiquidity: BigNumber
    5: bigint
    // totalBoostLiquidity: BigNumber
    6: bigint
  }[]
 * ```
 */
const fetchPoolInfos = async (
  farms: ComputedFarmConfigExtended[],
  chainId: number,
  provider: ({ chainId }: { chainId: number }) => PublicClient,
  chiefFarmerAddress: Address,
) => {
  try {
    const calls = farms.map(
      (farm) =>
        ({
          abi: chieffarmerExtendedAbi,
          address: chiefFarmerAddress,
          functionName: 'poolInfo',
          args: [BigInt(farm.pid)] as const,
        } as const),
    )

    const chiefFarmerMultiCallResult = await provider({ chainId }).multicall({
      contracts: calls,
      allowFailure: false,
    })

    let chiefFarmerChunkedResultCounter = 0
    return calls.map((chiefFarmerCall) => {
      if (chiefFarmerCall === null) {
        return null
      }
      const data = chiefFarmerMultiCallResult[chiefFarmerChunkedResultCounter]
      chiefFarmerChunkedResultCounter++
      return data
    })
  } catch (error) {
    console.error('ChiefFarmer Pool info data error', error)
    throw error
  }
}

export const getWayaApr = (poolWeight: string, activeTvlUSD: BN, wayaPriceUSD: string, wayaPerSecond: string) => {
  return getFarmApr({
    poolWeight,
    tvlUsd: activeTvlUSD,
    wayaPriceUsd: wayaPriceUSD,
    wayaPerSecond,
    precision: 6,
  })
}

const getExtendedFarmsDynamicData = ({ token0, token1, tick }: { token0: ERC20Token; token1: ERC20Token; tick: number }) => {
  const tokenPriceVsQuote = tickToPrice(token0, token1, tick)

  return {
    tokenPriceVsQuote: tokenPriceVsQuote.toSignificant(6),
  }
}

const getFarmAllocation = ({ allocPoint, totalAllocPoint }: { allocPoint?: bigint; totalAllocPoint?: bigint }) => {
  const _allocPoint = typeof allocPoint !== 'undefined' ? new BN(allocPoint.toString()) : BIG_ZERO
  const poolWeight = !!totalAllocPoint && !_allocPoint.isZero() ? _allocPoint.div(totalAllocPoint.toString()) : BIG_ZERO

  return {
    poolWeight: poolWeight.toString(),
    multiplier: !_allocPoint.isZero() ? `${+_allocPoint.div(10).toString()}X` : `0X`,
  }
}

const lmPoolAbi = [
  {
    inputs: [],
    name: 'lmLiquidity',
    outputs: [
      {
        internalType: 'uint128',
        name: '',
        type: 'uint128',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rewardGrowthGlobalX128',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const extendedPoolAbi = [
  {
    inputs: [],
    name: 'lmPool',
    outputs: [{ internalType: 'contract IPlexswapExtendedLmPool', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
      { internalType: 'int24', name: 'tick', type: 'int24' },
      { internalType: 'uint16', name: 'observationIndex', type: 'uint16' },
      { internalType: 'uint16', name: 'observationCardinality', type: 'uint16' },
      { internalType: 'uint16', name: 'observationCardinalityNext', type: 'uint16' },
      { internalType: 'uint32', name: 'feeProtocol', type: 'uint32' },
      { internalType: 'bool', name: 'unlocked', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

type Slot0 = [
  // sqrtPriceX96: BigNumber
  bigint,
  // tick: number
  number,
  // observationIndex: number
  number,
  // observationCardinality: number
  number,
  // observationCardinalityNext: number
  number,
  // feeProtocol: number
  // unlocked: boolean
  boolean,
]
type LmPool = `0x${string}`

async function fetchLmPools(
  lmPoolAddresses: Address[],
  chainId: number,
  provider: ({ chainId }: { chainId: number }) => PublicClient,
) {
  const lmPoolCalls = lmPoolAddresses.flatMap(
    (address) =>
      [
        {
          abi: lmPoolAbi,
          address,
          functionName: 'lmLiquidity',
        },
        {
          abi: lmPoolAbi,
          address,
          functionName: 'rewardGrowthGlobalX128',
        },
      ] as const,
  )

  const chunkSize = lmPoolCalls.length / lmPoolAddresses.length

  const resp = await provider({ chainId }).multicall({
    contracts: lmPoolCalls,
    allowFailure: true,
  })

  const chunked = chunk(resp, chunkSize)

  const lmPools: Record<
    string,
    {
      liquidity: string
      rewardGrowthGlobalX128: string
    }
  > = {}

  for (const [index, res] of chunked.entries()) {
    lmPools[lmPoolAddresses[index]] = {
      liquidity: res?.[0]?.result?.toString() ?? '0',
      rewardGrowthGlobalX128: res?.[1]?.result?.toString() ?? '0',
    }
  }

  return lmPools
}

async function fetchExtendedPools(
  farms: ComputedFarmConfigExtended[],
  chainId: number,
  provider: ({ chainId }: { chainId: number }) => PublicClient,
) {
  const extendedPoolCalls = farms.flatMap(
    (f) =>
      [
        {
          abi: extendedPoolAbi,
          address: f.lpAddress,
          functionName: 'slot0',
        },
        {
          abi: extendedPoolAbi,
          address: f.lpAddress,
          functionName: 'lmPool',
        },
      ] as const,
  )

  const chunkSize = extendedPoolCalls.length / farms.length
  const resp = await provider({ chainId }).multicall({
    contracts: extendedPoolCalls,
    allowFailure: false,
  })

  return chunk(resp, chunkSize) as [Slot0, LmPool][]
}

export type LPTvl = {
  token0: string
  token1: string
  updatedAt: string
}

export type TvlMap = {
  [key: string]: LPTvl | null
}

export type CommonPrice = {
  [address: string]: string
}

export const fetchCommonTokenUSDValue = async (priceHelper?: PriceHelper): Promise<CommonPrice> => {
  return fetchTokenUSDValues(priceHelper?.list || [])
}

export const fetchTokenUSDValues = async (currencies: Currency[] = []): Promise<CommonPrice> => {
  const commonTokenUSDValue: CommonPrice = {}
  if (!extendedFarmSupportedChainId.includes(currencies[0]?.chainId)) {
    return commonTokenUSDValue
  }

  // LOOKUP ERROR - 446/455

  if (currencies.length > 0) {
    const prices = await getCurrencyListUsdPrice(currencies)

    Object.entries(prices || {}).forEach(([key, value]) => {
      const [, address] = key.split(':')
      commonTokenUSDValue[getAddress(address)] = value.toString()
    })
  }

  return commonTokenUSDValue
}

export function getFarmsPrices(
  farms: FarmExtendedData[],
  wayaPriceUSD: string,
  commonPrice: CommonPrice,
): FarmExtendedDataWithPrice[] {
  const commonPriceFarms = farms.map((farm) => {
    let tokenPriceBusd = BIG_ZERO
    let quoteTokenPriceBusd = BIG_ZERO

    // try to get price via common price
    if (commonPrice[farm.quoteToken.address]) {
      quoteTokenPriceBusd = new BN(commonPrice[farm.quoteToken.address])
    }
    if (commonPrice[farm.token.address]) {
      tokenPriceBusd = new BN(commonPrice[farm.token.address])
    }

    // try price via WAYA
    if (
      tokenPriceBusd.isZero() &&
      farm.token.chainId in WAYA &&
      farm.token.equals(WAYA[farm.token.chainId as keyof typeof WAYA])
    ) {
      tokenPriceBusd = new BN(wayaPriceUSD)
    }
    if (
      quoteTokenPriceBusd.isZero() &&
      farm.quoteToken.chainId in WAYA &&
      farm.quoteToken.equals(WAYA[farm.quoteToken.chainId as keyof typeof WAYA])
    ) {
      quoteTokenPriceBusd = new BN(wayaPriceUSD)
    }

    // try to get price via token price vs quote
    if (tokenPriceBusd.isZero() && !quoteTokenPriceBusd.isZero() && farm.tokenPriceVsQuote) {
      tokenPriceBusd = quoteTokenPriceBusd.times(farm.tokenPriceVsQuote)
    }
    if (quoteTokenPriceBusd.isZero() && !tokenPriceBusd.isZero() && farm.tokenPriceVsQuote) {
      quoteTokenPriceBusd = tokenPriceBusd.div(farm.tokenPriceVsQuote)
    }

    return {
      ...farm,
      tokenPriceBusd,
      quoteTokenPriceBusd,
    }
  })

  return commonPriceFarms.map((farm) => {
    let { tokenPriceBusd, quoteTokenPriceBusd } = farm
    // if token price is zero, try to get price from existing farms
    if (tokenPriceBusd.isZero()) {
      const ifTokenPriceFound = commonPriceFarms.find(
        (f) =>
          (farm.token.equals(f.token) && !f.tokenPriceBusd.isZero()) ||
          (farm.token.equals(f.quoteToken) && !f.quoteTokenPriceBusd.isZero()),
      )
      if (ifTokenPriceFound) {
        tokenPriceBusd = farm.token.equals(ifTokenPriceFound.token)
          ? ifTokenPriceFound.tokenPriceBusd
          : ifTokenPriceFound.quoteTokenPriceBusd
      }
      if (quoteTokenPriceBusd.isZero()) {
        const ifQuoteTokenPriceFound = commonPriceFarms.find(
          (f) =>
            (farm.quoteToken.equals(f.token) && !f.tokenPriceBusd.isZero()) ||
            (farm.quoteToken.equals(f.quoteToken) && !f.quoteTokenPriceBusd.isZero()),
        )
        if (ifQuoteTokenPriceFound) {
          quoteTokenPriceBusd = farm.quoteToken.equals(ifQuoteTokenPriceFound.token)
            ? ifQuoteTokenPriceFound.tokenPriceBusd
            : ifQuoteTokenPriceFound.quoteTokenPriceBusd
        }

        // try to get price via token price vs quote
        if (tokenPriceBusd.isZero() && !quoteTokenPriceBusd.isZero() && farm.tokenPriceVsQuote) {
          tokenPriceBusd = quoteTokenPriceBusd.times(farm.tokenPriceVsQuote)
        }
        if (quoteTokenPriceBusd.isZero() && !tokenPriceBusd.isZero() && farm.tokenPriceVsQuote) {
          quoteTokenPriceBusd = tokenPriceBusd.div(farm.tokenPriceVsQuote)
        }

        if (tokenPriceBusd.isZero()) {
          console.error(`Can't get price for ${farm.token.address}`)
        }
        if (quoteTokenPriceBusd.isZero()) {
          console.error(`Can't get price for ${farm.quoteToken.address}`)
        }
      }
    }

    return {
      ...farm,
      tokenPriceBusd: tokenPriceBusd.toString(),
      // adjust the quote token price by the token price vs quote
      quoteTokenPriceBusd:
        !quoteTokenPriceBusd.isZero() && farm.tokenPriceVsQuote
          ? tokenPriceBusd.div(farm.tokenPriceVsQuote).toString()
          : quoteTokenPriceBusd.toString(),
    }
  })
}