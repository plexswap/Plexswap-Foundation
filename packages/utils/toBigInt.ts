import { BigintIsh } from '@plexswap/sdk-core'

export function toBigInt(num: BigintIsh): bigint {
  return BigInt(num.toString())
}
