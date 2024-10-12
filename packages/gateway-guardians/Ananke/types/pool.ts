import { Currency, CurrencyAmount, Percent } from '@plexswap/sdk-core'
import { FeeAmount, Tick } from '@plexswap/sdk-extended'
import { Address } from 'viem'

export enum PoolType {
  CORE,
  EXTENDED,
  STABLE,
}

export interface BasePool {
  type: PoolType
}

export interface CorePool extends BasePool {
  type: PoolType.CORE
  reserve0: CurrencyAmount<Currency>
  reserve1: CurrencyAmount<Currency>
}

export interface StablePool extends BasePool {
  address: Address
  type: PoolType.STABLE
  // Could be 2 token pool or more
  balances: CurrencyAmount<Currency>[]
  amplifier: bigint
  // Swap fee
  fee: Percent
}

export interface ExtendedPool extends BasePool {
  type: PoolType.EXTENDED
  token0: Currency
  token1: Currency
  // Different fee tier
  fee: FeeAmount
  liquidity: bigint
  sqrtRatioX96: bigint
  tick: number
  address: Address
  token0ProtocolFee: Percent
  token1ProtocolFee: Percent

  // Allow pool with no ticks data provided
  ticks?: Tick[]

  reserve0?: CurrencyAmount<Currency>
  reserve1?: CurrencyAmount<Currency>
}

export type Pool = CorePool | ExtendedPool | StablePool

export interface WithTvl {
  tvlUSD: bigint
}

export type ExtendedPoolWithTvl = ExtendedPool & WithTvl

export type CorePoolWithTvl = CorePool & WithTvl

export type StablePoolWithTvl = StablePool & WithTvl
