import { BigintIsh } from '@plexswap/sdk-core'
import type { Address } from 'viem'

export type MulticallRequest = {
  target: Address
  callData: string
}

export type MulticallRequestWithGas = MulticallRequest & {
  gasLimit: BigintIsh
}
