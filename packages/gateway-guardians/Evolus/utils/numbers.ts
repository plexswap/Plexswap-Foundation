import { Percent as PlexswapPercent } from '@plexswap/sdk-core'

export function encodeFeeBips(fee: PlexswapPercent): string {
  return fee.multiply(10_000).quotient.toString()
}
