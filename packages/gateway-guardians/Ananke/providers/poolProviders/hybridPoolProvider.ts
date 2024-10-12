import { OnChainProvider, PoolProvider, SubgraphProvider } from '../../types'
import { createPoolProviderWithCache } from './poolProviderWithCache'
import { getCandidatePools } from './getCandidatePools'

export interface HybridPoolProviderConfig {
  onChainProvider?: OnChainProvider
  coreSubgraphProvider?: SubgraphProvider
  extendedSubgraphProvider?: SubgraphProvider
}

export function createHybridPoolProvider({
  onChainProvider,
  coreSubgraphProvider,
  extendedSubgraphProvider,
}: HybridPoolProviderConfig): PoolProvider {
  const hybridPoolProvider: PoolProvider = {
    getCandidatePools: async (params) => {
      return getCandidatePools({ ...params, onChainProvider, coreSubgraphProvider, extendedSubgraphProvider })
    },
  }

  return createPoolProviderWithCache(hybridPoolProvider)
}
