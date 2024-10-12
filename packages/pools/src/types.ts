import { ChainId } from '@plexswap/chains'
import type { SerializedWrappedToken } from '@plexswap/metalists'
import { Address, PublicClient } from 'viem'
import BigNumber from 'bignumber.js'

export type OnChainProvider = ({ chainId }: { chainId?: ChainId }) => PublicClient

export type SerializedBigNumber = string

export interface Addresses {
  [chainId: number]: string
}

export enum PoolCategory {
  'COMMUNITY' = 'Community',
  'CORE' = 'Core',
  'BINANCE' = 'Binance', // Pools using native BNB behave differently than pools using a TOKEN
  'AUTO' = 'Auto',
}

export enum VaultKey {
  WayaVaultV1 = 'wayaVaultV1',
  WayaVault = 'wayaVault',
  WayaFlexibleVault = 'wayaFlexibleVault',
}

interface CorePoolProps {
  startTimestamp?: number
  endTimestamp?: number
  apr?: number
  rawApr?: number
  stakingTokenPrice?: number
  earningTokenPrice?: number
  vaultKey?: VaultKey
}

interface PoolInfo extends CorePoolProps {
  totalStaked?: BigNumber
  stakingLimit?: BigNumber
  stakingLimitEndTimestamp?: number
  userDataLoaded?: boolean
  userData?: {
    allowance: BigNumber
    stakingTokenBalance: BigNumber
    stakedBalance: BigNumber
    pendingReward: BigNumber
  }
}

interface SerializedPoolInfo extends CorePoolProps {
  totalStaked?: string
  stakingLimit?: string
  stakingLimitEndTimestamp?: number
  userDataLoaded?: boolean
  userData?: {
    allowance: string
    stakingTokenBalance: string
    stakedBalance: string
    pendingReward: string
  }
}

export interface PoolConfigBaseProps {
  poolId: number
  contractAddress: Address
  poolCategory: PoolCategory
  tokenPerBlock: string
  isFinished?: boolean
  enableEmergencyWithdraw?: boolean
  version?: string
}

interface GenericToken {
  decimals: number
  symbol: string
  address: string
}

export interface SerializedPoolConfig<T> extends PoolConfigBaseProps {
  earningToken: T & GenericToken
  stakingToken: T & GenericToken
}

export interface DeserializedPoolConfig<T> extends PoolConfigBaseProps {
  earningToken: T & GenericToken
  stakingToken: T & GenericToken
}

export type SerializedPool = SerializedPoolConfig<SerializedWrappedToken>

export type DeserializedPool<T> = DeserializedPoolConfig<T> & PoolInfo

export type DeserializedPoolVault<T> = DeserializedPool<T> & DeserializedWayaVault

export type DeserializedPoolLockedVault<T> = DeserializedPool<T> & DeserializedLockedWayaVault

export type SerializedPoolWithInfo = SerializedPool & SerializedPoolInfo

export type SerializedPoolAddon = SerializedPoolWithInfo & {
  numberSecondsForUserLimit?: number
}

export interface SerializedVaultFees {
  performanceFee: number
  withdrawalFee: number
  withdrawalFeePeriod: number
}

export interface DeserializedVaultFees extends SerializedVaultFees {
  performanceFeeAsDecimal: number
}

export interface SerializedVaultUser {
  isLoading: boolean
  userShares: SerializedBigNumber
  wayaAtLastUserAction: SerializedBigNumber
  lastDepositedTime: string
  lastUserActionTime: string
}

export interface SerializedLockedVaultUser extends SerializedVaultUser {
  lockStartTime: string
  lockEndTime: string
  userBoostedShare: SerializedBigNumber
  locked: boolean
  lockedAmount: SerializedBigNumber
  currentPerformanceFee: SerializedBigNumber
  currentOverdueFee: SerializedBigNumber
}

export interface DeserializedVaultUser {
  isLoading: boolean
  userShares: BigNumber
  wayaAtLastUserAction: BigNumber
  lastDepositedTime: string
  lastUserActionTime: string
  lockedAmount: BigNumber
  balance: {
    wayaAsNumberBalance: number
    wayaAsBigNumber: BigNumber
    wayaAsDisplayBalance: string
  }
}

export interface DeserializedLockedVaultUser extends DeserializedVaultUser {
  lastDepositedTime: string
  lastUserActionTime: string
  lockStartTime: string
  lockEndTime: string
  burnStartTime: string
  userBoostedShare: BigNumber
  locked: boolean
  lockedAmount: BigNumber
  currentPerformanceFee: BigNumber
  currentOverdueFee: BigNumber
}

export interface SerializedLockedWayaVault extends Omit<SerializedWayaVault, 'userData'> {
  totalLockedAmount?: SerializedBigNumber
  userData: SerializedLockedVaultUser
}

export interface SerializedWayaVault {
  totalShares?: SerializedBigNumber
  pricePerFullShare?: SerializedBigNumber
  totalWayaInVault?: SerializedBigNumber
  fees: SerializedVaultFees
  userData: SerializedVaultUser
}

export interface DeserializedWayaVault {
  totalShares?: BigNumber
  totalLockedAmount?: BigNumber
  pricePerFullShare: BigNumber
  totalWayaInVault?: BigNumber
  fees?: DeserializedVaultFees
  userData?: DeserializedVaultUser
}

export interface DeserializedLockedWayaVault extends Omit<DeserializedWayaVault, 'userData'> {
  totalLockedAmount?: BigNumber
  userData?: DeserializedLockedVaultUser
}

export interface PoolsState {
  data: SerializedPoolAddon[]
  wayaVault: SerializedLockedWayaVault
  wayaFlexibleVault: SerializedWayaVault
  userDataLoaded: boolean
}

