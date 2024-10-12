import { ChainId } from '@plexswap/chains'
import { BIG_ONE, BIG_TWO, BIG_ZERO } from '@plexswap/utils/bigNumber'
import { CurrencyParams, getCurrencyKey, getCurrencyListUsdPrice } from '@plexswap/trade-sentinels/Valorus'
import BN from 'bignumber.js'
import { Address, PublicClient, formatUnits } from 'viem'
import { TFarmCoreSupportedChainId, coreFarmSupportedChainId } from '../constants'
import { SerializedFarmConfig, isStableFarm } from '../types'
import { getFarmLpTokenPrice, getFarmsPrices } from './farmPrices'
import { fetchPublicFarmsData } from './fetchPublicFarmData'
import { fetchStableFarmData } from './fetchStableFarmData'
import { getFullDecimalMultiplier } from './getFullDecimalMultiplier'

const evmNativeStableLpMap: Record<
  TFarmCoreSupportedChainId,
  {
    address: Address
    wNative: string
    stable: string
  }
> = {
  [ChainId.BSC]: {
    address: '0x2C2643D51322738fC33f6588Cb28eDe3790094E1',
    wNative: 'WBNB',
    stable: 'BUSD',
  },
  [ChainId.BSC_TESTNET]: {
    address: '0x49120769a878215a350038AbB394072cEb6F4d4A',
    wNative: 'WBNB',
    stable: 'BUSD',
  },
  [ChainId.PLEXCHAIN]: {
    address: '0x8a233567a582de5110f03bdfe531fb6d1cb02969', 
    wNative: 'WPLEX',
    stable: 'USDP',
  },
}

export const getTokenAmount = (balance: BN, decimals: number) => {
  return balance.div(getFullDecimalMultiplier(decimals))
}

export type FetchFarmsParams = {
  farms: SerializedFarmConfig[]
  provider: ({ chainId }: { chainId: number }) => PublicClient
  isTestnet: boolean
  chiefFarmerAddress: string
  chainId: number
  totalRegularAllocPoint: bigint
  totalSpecialAllocPoint: bigint
}

export async function FetchFarmsCore({
  farms,
  provider,
  isTestnet,
  chiefFarmerAddress,
  chainId,
  totalRegularAllocPoint,
  totalSpecialAllocPoint,
}: FetchFarmsParams) {
  if (!coreFarmSupportedChainId.includes(chainId)) {
    return []
  }

  const stableFarms = farms.filter(isStableFarm)

  const [stableFarmsResults, poolInfos, lpDataResults] = await Promise.all([
    fetchStableFarmData(stableFarms, chainId, provider),
    fetchChiefFarmerData(farms, isTestnet, provider, chiefFarmerAddress),
    fetchPublicFarmsData(farms, chainId, provider, chiefFarmerAddress),
  ])

  const stableFarmsData = (stableFarmsResults as StableLpData[]).map(formatStableFarm)

  const stableFarmsDataMap = stableFarms.reduce<Record<number, FormatStableFarmResponse>>((map, farm, index) => {
    return {
      ...map,
      [farm.pid]: stableFarmsData[index],
    }
  }, {})

  const lpData = lpDataResults.map(formatClassicFarmResponse)

  const farmsData = farms.map((farm, index) => {
    try {
      return {
        ...farm,
        ...(stableFarmsDataMap[farm.pid]
          ? getStableFarmDynamicData({
              ...lpData[index],
              ...stableFarmsDataMap[farm.pid],
              token0Decimals: farm.token.decimals,
              token1Decimals: farm.quoteToken.decimals,
              price1: stableFarmsDataMap[farm.pid].price1,
            })
          : getClassicFarmsDynamicData({
              ...lpData[index],
              ...stableFarmsDataMap[farm.pid],
              token0Decimals: farm.token.decimals,
              token1Decimals: farm.quoteToken.decimals,
            })),
        ...getFarmAllocation({
          allocPoint: poolInfos[index]?.allocPoint,
          isRegular: poolInfos[index]?.isRegular,
          totalRegularAllocPoint: totalRegularAllocPoint,
          totalSpecialAllocPoint,
        }),
      }
    } catch (error) {
      console.error(error, farm, index, {
        allocPoint: poolInfos[index]?.allocPoint,
        isRegular: poolInfos[index]?.isRegular,
        token0Decimals: farm.token.decimals,
        token1Decimals: farm.quoteToken.decimals,
        totalRegularAllocPoint,
        totalSpecialAllocPoint,
      })
      throw error
    }
  })

  const decimals = 18
  const farmsDataWithPrices = getFarmsPrices(
    farmsData,
    evmNativeStableLpMap[chainId as TFarmCoreSupportedChainId],
    decimals,
  )

  const tokensWithoutPrice = farmsDataWithPrices.reduce<Map<string, CurrencyParams>>((acc, cur) => {
    if (cur.tokenPriceBusd === '0') {
      acc.set(cur.token.address, cur.token)
    }
    if (cur.quoteTokenPriceBusd === '0') {
      acc.set(cur.quoteToken.address, cur.quoteToken)
    }
    return acc
  }, new Map<string, CurrencyParams>())
  const tokenInfoList = Array.from(tokensWithoutPrice.values())

  // LOOKUP ERROR - 141-170

  if (tokenInfoList.length) { 
    const prices = await getCurrencyListUsdPrice(tokenInfoList)

    return farmsDataWithPrices.map((f) => {
      if (f.tokenPriceBusd !== '0' && f.quoteTokenPriceBusd !== '0') {
        return f
      }
      const tokenKey = getCurrencyKey(f.token)
      const quoteTokenKey = getCurrencyKey(f.quoteToken)
      const tokenVsQuote = new BN(f.tokenPriceVsQuote)
      let tokenPrice = new BN(tokenKey ? prices[tokenKey] ?? 0 : 0)
      let quoteTokenPrice = new BN(quoteTokenKey ? prices[quoteTokenKey] ?? 0 : 0)
      if (tokenVsQuote.gt(0)) {
        if (tokenPrice.eq(0) && quoteTokenPrice.gt(0)) {
          tokenPrice = quoteTokenPrice.div(tokenVsQuote)
        } else if (quoteTokenPrice.eq(0) && tokenPrice.gt(0)) {
          quoteTokenPrice = tokenPrice.times(tokenVsQuote)
        }
      }
      const lpTokenPrice = getFarmLpTokenPrice(f, tokenPrice, quoteTokenPrice, decimals)
      return {
        ...f,
        tokenPriceBusd: tokenPrice.toString(),
        quoteTokenPriceBusd: quoteTokenPrice.toString(),
        lpTokenPrice: lpTokenPrice.toString(),
      }
    })
  }

  return farmsDataWithPrices
}

const chiefFarmerCoreAbi = [
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'poolInfo',
    outputs: [
      { internalType: 'uint256', name: 'accWayaPerShare', type: 'uint256' },
      { internalType: 'uint256', name: 'lastRewardBlock', type: 'uint256' },
      { internalType: 'uint256', name: 'allocPoint', type: 'uint256' },
      { internalType: 'uint256', name: 'totalBoostedShare', type: 'uint256' },
      { internalType: 'bool', name: 'isRegular', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'poolLength',
    outputs: [{ internalType: 'uint256', name: 'pools', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalRegularAllocPoint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSpecialAllocPoint',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bool', name: '_isRegular', type: 'bool' }],
    name: 'wayaPerBlock',
    outputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const chiefFarmerFarmCalls = (farm: SerializedFarmConfig, chiefFarmerAddress: string) => {
  const { pid } = farm

  return pid || pid === 0
    ? ({
        abi: chiefFarmerCoreAbi,
        address: chiefFarmerAddress as Address,
        functionName: 'poolInfo',
        args: [BigInt(pid)],
      } as const)
    : null
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}

export const fetchChiefFarmerData = async (
  farms: SerializedFarmConfig[],
  isTestnet: boolean,
  provider: ({ chainId }: { chainId: number }) => PublicClient,
  chiefFarmerAddress: string,
) => {
  try {
    const chiefFarmerCalls = farms.map((farm) => chiefFarmerFarmCalls(farm, chiefFarmerAddress))
    const chiefFarmerAggregatedCalls = chiefFarmerCalls.filter(notEmpty)

    const chainId = isTestnet ? ChainId.BSC_TESTNET : ChainId.BSC
    const chiefFarmerMultiCallResult = await provider({ chainId }).multicall({
      contracts: chiefFarmerAggregatedCalls,
      allowFailure: false,
    })

    let chiefFarmerChunkedResultCounter = 0
    return chiefFarmerCalls.map((chiefFarmerCall) => {
      if (chiefFarmerCall === null) {
        return null
      }
      const data = chiefFarmerMultiCallResult[chiefFarmerChunkedResultCounter]
      chiefFarmerChunkedResultCounter++
      return {
        accWayaPerShare: data[0],
        lastRewardBlock: data[1],
        allocPoint: data[2],
        totalBoostedShare: data[3],
        isRegular: data[4],
      }
    })
  } catch (error) {
    console.error('ChiefFarmer Pool info data error', error)
    throw error
  }
}

export const fetchChiefFarmerCoreData = async ({
  provider,
  isTestnet,
  chiefFarmerAddress,
}: {
  provider: ({ chainId }: { chainId: number }) => PublicClient
  isTestnet: boolean
  chiefFarmerAddress: Address
}) => {
  try {
    const chainId = isTestnet ? ChainId.BSC_TESTNET : ChainId.BSC
    const [poolLength, totalRegularAllocPoint, totalSpecialAllocPoint, wayaPerBlock] = await provider({
      chainId,
    }).multicall({
      contracts: [
        {
          abi: chiefFarmerCoreAbi,
          address: chiefFarmerAddress,
          functionName: 'poolLength',
        },
        {
          abi: chiefFarmerCoreAbi,
          address: chiefFarmerAddress,
          functionName: 'totalRegularAllocPoint',
        },
        {
          abi: chiefFarmerCoreAbi,
          address: chiefFarmerAddress,
          functionName: 'totalSpecialAllocPoint',
        },
        {
          abi: chiefFarmerCoreAbi,
          address: chiefFarmerAddress,
          functionName: 'wayaPerBlock',
          args: [true],
        },
      ],
      allowFailure: false,
    })

    return {
      poolLength,
      totalRegularAllocPoint,
      totalSpecialAllocPoint,
      wayaPerBlock,
    }
  } catch (error) {
    console.error('Get ChiefFarmer data error', error)
    throw error
  }
}

type StableLpData = [balanceResponse, balanceResponse, balanceResponse, balanceResponse]

type FormatStableFarmResponse = {
  tokenBalanceLP: BN
  quoteTokenBalanceLP: BN
  price1: bigint
}

const formatStableFarm = (stableFarmData: StableLpData): FormatStableFarmResponse => {
  const [balance1, balance2, _, _price1] = stableFarmData
  return {
    tokenBalanceLP: new BN(balance1.toString()),
    quoteTokenBalanceLP: new BN(balance2.toString()),
    price1: _price1,
  }
}

const getStableFarmDynamicData = ({
  lpTokenBalanceMC,
  lpTotalSupply,
  quoteTokenBalanceLP,
  tokenBalanceLP,
  token0Decimals,
  token1Decimals,
  price1,
}: FormatClassicFarmResponse & {
  token1Decimals: number
  token0Decimals: number
  price1: bigint
}) => {
  // Raw amount of token in the LP, including those not staked
  const tokenAmountTotal = getTokenAmount(tokenBalanceLP, token0Decimals)
  const quoteTokenAmountTotal = getTokenAmount(quoteTokenBalanceLP, token1Decimals)

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio =
    !lpTotalSupply.isZero() && !lpTokenBalanceMC.isZero() ? lpTokenBalanceMC.div(lpTotalSupply) : BIG_ZERO

  const tokenPriceVsQuote = formatUnits(price1, token0Decimals)

  // Amount of quoteToken in the LP that are staked in the MC
  const quoteTokenAmountMcFixed = quoteTokenAmountTotal.times(lpTokenRatio)

  // Amount of token in the LP that are staked in the MC
  const tokenAmountMcFixed = tokenAmountTotal.times(lpTokenRatio)

  const quoteTokenAmountMcFixedByTokenAmount = tokenAmountMcFixed.times(BIG_ONE.div(tokenPriceVsQuote))

  const lpTotalInQuoteToken = quoteTokenAmountMcFixed.plus(quoteTokenAmountMcFixedByTokenAmount)

  return {
    tokenAmountTotal: tokenAmountTotal.toString(),
    quoteTokenAmountTotal: quoteTokenAmountTotal.toString(),
    lpTotalSupply: lpTotalSupply.toString(),
    lpTotalInQuoteToken: lpTotalInQuoteToken.toString(),
    tokenPriceVsQuote,
  }
}

type balanceResponse = bigint

export type ClassicLPData = [balanceResponse, balanceResponse, balanceResponse, balanceResponse]

type FormatClassicFarmResponse = {
  tokenBalanceLP: BN
  quoteTokenBalanceLP: BN
  lpTokenBalanceMC: BN
  lpTotalSupply: BN
}

const formatClassicFarmResponse = (farmData: ClassicLPData): FormatClassicFarmResponse => {
  const [tokenBalanceLP, quoteTokenBalanceLP, lpTokenBalanceMC, lpTotalSupply] = farmData
  return {
    tokenBalanceLP: new BN(tokenBalanceLP.toString()),
    quoteTokenBalanceLP: new BN(quoteTokenBalanceLP.toString()),
    lpTokenBalanceMC: new BN(lpTokenBalanceMC.toString()),
    lpTotalSupply: new BN(lpTotalSupply.toString()),
  }
}

interface FarmAllocationParams {
  allocPoint?: bigint
  isRegular?: boolean
  totalRegularAllocPoint: bigint
  totalSpecialAllocPoint: bigint
}

const getFarmAllocation = ({
  allocPoint,
  isRegular,
  totalRegularAllocPoint,
  totalSpecialAllocPoint,
}: FarmAllocationParams) => {
  const _allocPoint = allocPoint ? new BN(allocPoint.toString()) : BIG_ZERO
  const totalAlloc = isRegular ? totalRegularAllocPoint : totalSpecialAllocPoint
  const poolWeight = !!totalAlloc && !!_allocPoint ? _allocPoint.div(totalAlloc.toString()) : BIG_ZERO

  return {
    poolWeight: poolWeight.toString(),
    multiplier: !_allocPoint.isZero() ? `${+_allocPoint.div(10).toString()}X` : `0X`,
  }
}

const getClassicFarmsDynamicData = ({
  lpTokenBalanceMC,
  lpTotalSupply,
  quoteTokenBalanceLP,
  tokenBalanceLP,
  token0Decimals,
  token1Decimals,
}: FormatClassicFarmResponse & {
  token0Decimals: number
  token1Decimals: number
  lpTokenStakedAmount?: string
}) => {
  // Raw amount of token in the LP, including those not staked
  const tokenAmountTotal = getTokenAmount(tokenBalanceLP, token0Decimals)
  const quoteTokenAmountTotal = getTokenAmount(quoteTokenBalanceLP, token1Decimals)

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio =
    !lpTotalSupply.isZero() && !lpTokenBalanceMC.isZero() ? lpTokenBalanceMC.div(lpTotalSupply) : BIG_ZERO

  // // Amount of quoteToken in the LP that are staked in the MC
  const quoteTokenAmountMcFixed = quoteTokenAmountTotal.times(lpTokenRatio)

  // // Total staked in LP, in quote token value
  const lpTotalInQuoteToken = quoteTokenAmountMcFixed.times(BIG_TWO)

  return {
    tokenAmountTotal: tokenAmountTotal.toString(),
    quoteTokenAmountTotal: quoteTokenAmountTotal.toString(),
    lpTotalSupply: lpTotalSupply.toString(),
    lpTotalInQuoteToken: lpTotalInQuoteToken.toString(),
    tokenPriceVsQuote:
      !quoteTokenAmountTotal.isZero() && !tokenAmountTotal.isZero()
        ? quoteTokenAmountTotal.div(tokenAmountTotal).toString()
        : BIG_ZERO.toString(),
    lpTokenStakedAmount: lpTokenBalanceMC.toString(),
  }
}
