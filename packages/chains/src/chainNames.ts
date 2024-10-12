import { ChainId } from './chainId'

export const chainNames: Record<ChainId, string> = {
  [ChainId.BSC]: 'bsc',
  [ChainId.BSC_TESTNET]: 'bscTestnet',
  [ChainId.PLEXCHAIN]: 'plexchain',
}

export const chainNameToChainId = Object.entries(chainNames).reduce((acc, [chainId, chainName]) => {
  return {
    [chainName]: chainId as unknown as ChainId,
    ...acc,
  }
}, {} as Record<string, ChainId>)

// @see https://github.com/DefiLlama/defillama-server/blob/master/common/chainToCoingeckoId.ts
// @see https://github.com/DefiLlama/chainlist/blob/main/constants/chainIds.json
export const defiLlamaChainNames: Record<ChainId, string> = {
  [ChainId.BSC]: 'bsc',
  [ChainId.BSC_TESTNET]: '',
  [ChainId.PLEXCHAIN]: '',
}

export const chainNamesInKebabCase = {
  [ChainId.PLEXCHAIN]: 'plexchain',
  [ChainId.BSC]: 'bsc',
  [ChainId.BSC_TESTNET]: 'bsc-testnet',
} as const

export const mainnetChainNamesInKebabCase = {
  [ChainId.PLEXCHAIN]: 'plexchain',
  [ChainId.BSC]: 'bsc',
  [ChainId.BSC_TESTNET]: 'bsc',
} as const
