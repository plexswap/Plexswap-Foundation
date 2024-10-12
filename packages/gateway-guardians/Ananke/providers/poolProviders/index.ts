import { PoolProvider } from '../../types'
import { HybridPoolProviderConfig, createHybridPoolProvider } from './hybridPoolProvider'

// For evm
export function createPoolProvider(config: HybridPoolProviderConfig): PoolProvider {
  const hybridPoolProvider = createHybridPoolProvider(config)
  return hybridPoolProvider
}

export * from './getCandidatePools'
export * from './getExtendedCandidatePools'
export * from './getStableCandidatePools'
export * from './getCoreCandidatePools'
export * from './hybridPoolProvider'
export * from './onChainPoolProviders'
export * from './poolTvlSelectors'
export * from './staticPoolProvider'
export * from './subgraphPoolProviders'

