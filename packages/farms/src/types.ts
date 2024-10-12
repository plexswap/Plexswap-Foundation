import { SerializedWrappedToken } from '@plexswap/metalists'
import { SerializedToken, Token } from '@plexswap/sdk-core'
import { FeeAmount } from '@plexswap/sdk-extended'
import BigNumber from 'bignumber.js'
import { Address } from 'viem'

export type FarmsDynamicDataResult = {
  tokenAmountTotal: string
  quoteTokenAmountTotal: string
  lpTotalSupply: string
  lpTotalInQuoteToken: string
  tokenPriceVsQuote: string
  poolWeight: string
  multiplier: string
}

export type FarmsDynamicDataResultCore = {
  lmPool: string
  lmPoolLiquidity: string
  tokenPriceVsQuote: string
  poolWeight: string
  multiplier: string
}

export type FarmPriceExtended = {
  tokenPriceBusd: string
  quoteTokenPriceBusd: string
}

export type FarmTVL = {
  activeTvlUSD?: string
  activeTvlUSDUpdatedAt?: string
  wayaApr?: string
}

export type FarmData = SerializedFarmConfig & FarmsDynamicDataResult

export type FarmExtendedData = ComputedFarmConfigExtended & FarmsDynamicDataResultCore

export type FarmExtendedDataWithPrice = FarmExtendedData & FarmPriceExtended

export type FarmExtendedDataWithPriceTVL = FarmExtendedDataWithPrice & FarmTVL

export type SerializedFarmExtendedDataWithPrice = FarmExtendedData & FarmPriceExtended & SerializedComputedFarmConfigExtended

export interface FarmConfigBaseProps {
  pid: number
  v1pid?: number
  vaultPid?: number
  lpSymbol: string
  lpAddress: Address
  multiplier?: string
  dual?: {
    token: SerializedWrappedToken
    aptIncentiveInfo: number
  }
  boosted?: boolean
  allocPoint?: number
  wayaWrapperAddress?: Address
}

export interface SerializedStableFarmConfig extends FarmConfigBaseProps {
  token: SerializedWrappedToken
  quoteToken: SerializedWrappedToken
  stableSwapAddress: Address
  infoStableSwapAddress: Address
  stableLpFee?: number
  stableLpFeeRateOfTotalFee?: number
}

export interface SerializedClassicFarmConfig extends FarmConfigBaseProps {
  token: SerializedWrappedToken
  quoteToken: SerializedWrappedToken
}

export type ComputedFarmConfigExtended = {
  pid: number
  lpSymbol: string
  lpAddress: Address
  boosted?: boolean

  token: Token
  quoteToken: Token
  feeAmount: FeeAmount

  token0: Token
  token1: Token
}

export type SerializedComputedFarmConfigExtended = ComputedFarmConfigExtended & {
  pid: number
  lpSymbol: string
  lpAddress: Address
  boosted?: boolean

  token: SerializedToken
  quoteToken: SerializedToken
  feeAmount: FeeAmount
}

export type FarmConfigExtended = {
  pid: number
  lpAddress: Address
  boosted?: boolean
  token0: Token
  token1: Token
  feeAmount: FeeAmount
}

export type SerializedFarmConfig = SerializedStableFarmConfig | SerializedClassicFarmConfig

export interface SerializedFarmPublicData extends SerializedClassicFarmConfig {
  lpTokenPrice?: string
  lpRewardsApr?: number
  tokenPriceBusd?: string
  quoteTokenPriceBusd?: string
  tokenAmountTotal?: string
  quoteTokenAmountTotal?: string
  lpTotalInQuoteToken?: string
  lpTotalSupply?: string
  tokenPriceVsQuote?: string
  poolWeight?: string
  boosted?: boolean
  infoStableSwapAddress?: Address
  stableSwapAddress?: string
  stableLpFee?: number
  stableLpFeeRateOfTotalFee?: number
  lpTokenStakedAmount?: string
  wayaWrapperAddress?: Address
}

export interface AprMap {
  [key: string]: number
}

export function isStableFarm(farmConfig: SerializedFarmConfig): farmConfig is SerializedStableFarmConfig {
  return 'stableSwapAddress' in farmConfig && typeof farmConfig.stableSwapAddress === 'string'
}

export interface SerializedFarmUserData {
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
  earningsDualTokenBalance?: string
  proxy?: {
    allowance: string
    tokenBalance: string
    stakedBalance: string
    earnings: string
  }
}

export interface SerializedWayaUserData {
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
  earningsDualTokenBalance?: string
  boosterMultiplier?: number
  boostedAmounts?: string
  boosterContractAddress?: Address
  rewardPerSecond?: number
  startTimestamp?: number
  endTimestamp?: number
}

export interface SerializedFarm extends SerializedFarmPublicData {
  userData?: SerializedFarmUserData
  wayaUserData?: SerializedWayaUserData
  wayaPublicData?: SerializedWayaUserData
}

export interface SerializedFarmsExtendedState {
  data: SerializedFarmPublicData[]
  chainId?: number
  userDataLoaded: boolean
  loadingKeys: Record<string, boolean>
  poolLength?: number
}

export interface SerializedFarmsState {
  data: SerializedFarm[]
  chainId?: number
  loadArchivedFarmsData: boolean
  userDataLoaded: boolean
  wayaUserDataLoaded: boolean
  loadingKeys: Record<string, boolean>
  poolLength?: number
  regularWayaPerBlock?: number
  totalRegularAllocPoint: string
}

export interface DeserializedFarmConfig extends FarmConfigBaseProps {
  token: Token
  quoteToken: Token
}

export interface DeserializedFarmUserData {
  allowance: BigNumber
  tokenBalance: BigNumber
  stakedBalance: BigNumber
  earnings: BigNumber
  earningsDualTokenBalance?: BigNumber
  proxy?: {
    allowance: BigNumber
    tokenBalance: BigNumber
    stakedBalance: BigNumber
    earnings: BigNumber
  }
}
export interface DeserializedWayaWrapperUserData {
  allowance: BigNumber
  tokenBalance: BigNumber
  stakedBalance: BigNumber
  earnings: BigNumber
  earningsDualTokenBalance?: BigNumber
  boosterMultiplier?: number
  boostedAmounts?: BigNumber
  boosterContractAddress?: Address
  rewardPerSecond?: number
  startTimestamp?: number
  endTimestamp?: number
  isRewardInRange?: boolean
}

export interface DeserializedFarm extends DeserializedFarmConfig {
  tokenPriceBusd?: string
  quoteTokenPriceBusd?: string
  tokenAmountTotal?: BigNumber
  quoteTokenAmountTotal?: BigNumber
  lpTotalInQuoteToken?: BigNumber
  lpTotalSupply?: BigNumber
  lpTokenPrice?: BigNumber
  tokenPriceVsQuote?: BigNumber
  poolWeight?: BigNumber
  userData?: DeserializedFarmUserData
  wayaUserData?: DeserializedWayaWrapperUserData
  wayaPublicData?: DeserializedWayaWrapperUserData
  boosted?: boolean
  wayaWrapperAddress?: Address
  isStable?: boolean
  stableSwapAddress?: string
  stableLpFee?: number
  stableLpFeeRateOfTotalFee?: number
  lpTokenStakedAmount?: BigNumber
  lpRewardsApr?: number
  dual?: {
    token: Token
    aptIncentiveInfo: number
  }
}

export interface DeserializedFarmsState {
  data: DeserializedFarm[]
  loadArchivedFarmsData: boolean
  userDataLoaded: boolean
  poolLength: number
  regularWayaPerBlock: number
  totalRegularAllocPoint: string
  wayaPerBlock?: string
}

export interface FarmWithStakedValue extends DeserializedFarm {
  apr?: number
  liquidity?: BigNumber
  dualTokenRewardApr?: number
}

// Extended
export interface SerializedFarmsExtendedResponse {
  poolLength: number
  farmsWithPrice: SerializedFarmExtendedDataWithPrice[]
  wayaPerSecond: string
  totalAllocPoint: string
}

export interface FarmsExtendedResponse<T extends FarmExtendedDataWithPrice = FarmExtendedDataWithPrice> {
  chainId: number
  poolLength: number
  farmsWithPrice: T[]
  wayaPerSecond: string
  totalAllocPoint: string
}

export type IPendingWayaByTokenId = Record<string, bigint>

export interface PositionDetails {
  nonce: bigint
  tokenId: bigint
  operator: string
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: bigint
  feeGrowthInside0LastX128: bigint
  feeGrowthInside1LastX128: bigint
  tokensOwed0: bigint
  tokensOwed1: bigint
  isStaked?: boolean
}

export interface FarmExtendedDataWithPriceAndUserInfo extends FarmExtendedDataWithPriceTVL {
  unstakedPositions: PositionDetails[]
  stakedPositions: PositionDetails[]
  pendingWayaByTokenIds: IPendingWayaByTokenId
}