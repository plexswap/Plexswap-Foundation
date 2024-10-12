import { ChainId } from '@plexswap/chains'

type ExtendedPoolFetchConfig = {
  gasLimit: bigint
  retryGasMultiplier: number
}

const DEFAULT_FETCH_CONFIG: ExtendedPoolFetchConfig = {
  gasLimit: 3000000n,
  retryGasMultiplier: 2,
}

const EXTENDED_POOL_FETCH_CONFIG: { [key in ChainId]?: ExtendedPoolFetchConfig } = {}

export function getExtendedPoolFetchConfig(chainId: ChainId) {
  return EXTENDED_POOL_FETCH_CONFIG[chainId] || DEFAULT_FETCH_CONFIG
}
