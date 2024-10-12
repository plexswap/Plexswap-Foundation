import { ChainId } from '@plexswap/chains'
import { Token, WNATIVE } from '@plexswap/sdk-core'

export function getNativeWrappedToken(chainId: ChainId): Token | null {
  return WNATIVE[chainId] ?? null
}
