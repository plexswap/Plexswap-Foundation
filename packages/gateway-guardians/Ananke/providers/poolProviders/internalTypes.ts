import { Currency } from '@plexswap/sdk-core'
import { FeeAmount } from '@plexswap/sdk-extended'
import { Address } from 'viem'

// Information used to identify a pool
export interface PoolMeta {
  currencyA: Currency
  currencyB: Currency
  address: Address
}

export interface ExtendedPoolMeta extends PoolMeta {
  fee: FeeAmount
}