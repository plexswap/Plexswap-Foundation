import { ChainId } from '@plexswap/chains'
import BigNumber from 'bignumber.js'
import { PublicClient, formatEther } from 'viem'
import {
    TFarmCoreSupportedChainId,
    TFarmExtendedSupportedChainId,
    TFarmAllSupportedChainId,
    chiefFarmerCoreAddresses,
    chiefFarmerExtendedAddresses,
    extendedFarmSupportedChainId,
    allFarmSupportedChainId,
    coreFarmSupportedChainId,
    wayaSupportedChainId,
} from './constants'
import {
    CommonPrice,
    LPTvl,
    farmExtendedFetchFarms,
    fetchChiefFarmerExtendedData,
    fetchCommonTokenUSDValue,
    fetchTokenUSDValues,
    getWayaApr,
} from './fetchFarmsExtended'
import { ComputedFarmConfigExtended, FarmExtendedDataWithPrice } from './types'
import { FetchFarmsParams, FetchFarmsCore, fetchChiefFarmerCoreData } from './core/fetchFarmsCore'

export { extendedFarmSupportedChainId, allFarmSupportedChainId, coreFarmSupportedChainId, wayaSupportedChainId, type TFarmExtendedSupportedChainId, type TFarmAllSupportedChainId }

export function createFarmFetcher(provider: ({ chainId }: { chainId: TFarmCoreSupportedChainId }) => PublicClient) {
  const fetchFarms = async (
    params: {
      isTestnet: boolean
    } & Pick<FetchFarmsParams, 'chainId' | 'farms'>,
  ) => {
    const { isTestnet, farms, chainId } = params
    const chiefFarmerAddress = isTestnet ? chiefFarmerCoreAddresses[ChainId.BSC_TESTNET] : chiefFarmerCoreAddresses[ChainId.BSC]
    const { poolLength, totalRegularAllocPoint, totalSpecialAllocPoint, wayaPerBlock } = await fetchChiefFarmerCoreData({
      isTestnet,
      provider,
      chiefFarmerAddress,
    })
    const regularWayaPerBlock = formatEther(wayaPerBlock)
    const farmsWithPrice = await FetchFarmsCore({
      provider,
      chiefFarmerAddress,
      isTestnet,
      chainId,
      farms: farms.filter((f) => !f.pid || poolLength > f.pid),
      totalRegularAllocPoint,
      totalSpecialAllocPoint,
    })

    return {
      farmsWithPrice,
      poolLength: Number(poolLength),
      regularWayaPerBlock: +regularWayaPerBlock,
      totalRegularAllocPoint: totalRegularAllocPoint.toString(),
    }
  }

  return {
    fetchFarms,
    isChainSupported: (chainId: number) => coreFarmSupportedChainId.includes(chainId),
    allFarmSupportedChainId: coreFarmSupportedChainId,
    isTestnet: (chainId: number) => ![ChainId.BSC, ChainId.PLEXCHAIN].includes(chainId),
  }
}

export function createFarmFetcherExtended(provider: ({ chainId }: { chainId: number }) => PublicClient) {
  const fetchFarms = async ({
    farms,
    chainId,
    commonPrice,
  }: {
    farms: ComputedFarmConfigExtended[]
    chainId: TFarmExtendedSupportedChainId
    commonPrice: CommonPrice
  }) => {
    const chiefFarmerAddress = chiefFarmerExtendedAddresses[chainId]
    if (!chiefFarmerAddress || !provider) {
      throw new Error('Unsupported chain')
    }

    try {
      const { poolLength, totalAllocPoint, latestPeriodWayaPerSecond } = await fetchChiefFarmerExtendedData({
        provider,
        chiefFarmerAddress,
        chainId,
      })

      const wayaPerSecond = new BigNumber(latestPeriodWayaPerSecond.toString()).div(1e18).div(1e12).toString()

      const farmsWithPrice = await farmExtendedFetchFarms({
        farms,
        chainId,
        provider,
        chiefFarmerAddress,
        totalAllocPoint,
        commonPrice,
      })

      return {
        chainId,
        poolLength: Number(poolLength),
        farmsWithPrice,
        wayaPerSecond,
        totalAllocPoint: totalAllocPoint.toString(),
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  const getWayaAprAndTVL = (farm: FarmExtendedDataWithPrice, lpTVL: LPTvl, wayaPrice: string, wayaPerSecond: string) => {
    const [token0Price, token1Price] = farm.token.sortsBefore(farm.quoteToken)
      ? [farm.tokenPriceBusd, farm.quoteTokenPriceBusd]
      : [farm.quoteTokenPriceBusd, farm.tokenPriceBusd]
    const tvl = new BigNumber(token0Price).times(lpTVL.token0).plus(new BigNumber(token1Price).times(lpTVL.token1))

    const wayaApr = getWayaApr(farm.poolWeight, tvl, wayaPrice, wayaPerSecond)

    return {
      activeTvlUSD: tvl.toString(),
      activeTvlUSDUpdatedAt: lpTVL.updatedAt,
      wayaApr,
    }
  }

  return {
    fetchFarms,
    getWayaAprAndTVL,
    isChainSupported: (chainId: number): chainId is TFarmExtendedSupportedChainId => extendedFarmSupportedChainId.includes(chainId),
    allFarmSupportedChainId: extendedFarmSupportedChainId,
    isTestnet: (chainId: number) => ![ChainId.BSC, ChainId.PLEXCHAIN].includes(chainId),
  }
}

export * from './apr'
export * from './types'
export * from './utils'
export * from './core/deserializeFarm'
export * from './core/deserializeFarmUserData'
export type { FarmWithPrices } from './core/farmPrices'
export * from './core/farmsPriceHelpers'
export * from './core/filterFarmsByQuery'
export * from './constants'
export { chiefFarmerExtendedAddresses, fetchCommonTokenUSDValue, fetchTokenUSDValues }

