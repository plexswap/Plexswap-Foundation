import { ChainId } from '@plexswap/chains'
import { Token } from '@plexswap/sdk-core'

import { usdGasTokensByChain } from './../../config/constants'

export function getUsdGasToken(chainId: ChainId): Token | null {
  return usdGasTokensByChain[chainId]?.[0] ?? null
}
