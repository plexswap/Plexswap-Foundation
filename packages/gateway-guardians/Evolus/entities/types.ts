import { PermitSingle } from '@plexswap/hub-center/Licentia'
import { BigintIsh } from '@plexswap/sdk-core'
import { Address } from 'viem'
import { SwapOptions } from './../../Ananke'

export interface Permit2Signature extends PermitSingle {
  signature: `0x${string}`
}

export type SwapRouterConfig = {
  sender?: Address // address
  deadline?: BigintIsh | undefined
}

export type FlatFeeOptions = {
  amount: BigintIsh
  recipient: Address
}

export type PlexswapOptions = Omit<SwapOptions, 'inputTokenPermit'> & {
  inputTokenPermit?: Permit2Signature
  flatFee?: FlatFeeOptions
}
