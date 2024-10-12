import { ChainId } from '@plexswap/chains'
import { Token } from '@plexswap/sdk-core'

// a list of tokens by chain
export type ChainMap<T> = {
  readonly [chainId in ChainId]: T
}

export type ChainTokenList = ChainMap<Token[]>
