import { ChainId } from './chainId'

type SubgraphParams = {
  noderealApiKey?: string
  theGraphApiKey?: string
}
const publicSubgraphParams = {
  // Public key for theGraph subgraph endpoint
  theGraphApiKey: 'ae63266f663cff03919653f9ae3ade22',
}

export const CORE_SUBGRAPHS = getCoreSubgraphs(publicSubgraphParams)

export const EXTENDED_SUBGRAPHS = getExtendedSubgraphs(publicSubgraphParams)

export const STABLESWAP_SUBGRAPHS = getStableSwapSubgraphs(publicSubgraphParams)

export const BLOCKS_SUBGRAPHS = getBlocksSubgraphs()

export function getCoreSubgraphs({ theGraphApiKey }: SubgraphParams) {
  return {
    [ChainId.BSC]: `https://gateway-arbitrum.network.thegraph.com/api/${theGraphApiKey}/subgraphs/id/5pb64kMj3aEefs1DqnhDtM94UBeiC6LNX6DD9NqKmJdy`,
  }
}

export function getExtendedSubgraphs({ theGraphApiKey }: SubgraphParams) {
  return {
  [ChainId.BSC]: `https://gateway-arbitrum.network.thegraph.com/api/${theGraphApiKey}/subgraphs/id/32MkDhGQ9Xjmf9LpStHuGCYiehCwPd8Sakm2TiuPYBUH`,
  [ChainId.BSC_TESTNET]: `https://gateway-arbitrum.network.thegraph.com/api/${theGraphApiKey}/subgraphs/id/DdBQekWhz9ksc4aaVkGeYnLMZsCuThNMMY9FBDK9Eq1X`,
  } as const
}


export function getStableSwapSubgraphs({ theGraphApiKey }: SubgraphParams) {
  return {
  [ChainId.BSC]: `https://gateway-arbitrum.network.thegraph.com/api/${theGraphApiKey}/subgraphs/id/HXCS3oK7MmjNs7hMkyH53LNkStaLWmsZprqjg54w2zRT`,
   } as const
}

export function getBlocksSubgraphs() {
  return {
    [ChainId.BSC]: 'https://api.studio.thegraph.com/query/31296/plexblocks/version/latest',
  } as const
}