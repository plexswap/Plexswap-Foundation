import { ChainId } from '@plexswap/chains'
import { SerializedPool } from '../../types'
import { SupportedChainId, isPoolsSupported } from '../supportedChains'
import { livePools as bscLivePools, pools as bscPools } from './56'
import { livePools as bscTestnetLivePools, pools as bscTestnetPools } from './97'
import { livePools as plexchainLivePools, pools as plexchainPools } from './1149'

export type PoolsConfigByChain<TChainId extends ChainId> = {
    [chainId in TChainId]: SerializedPool[]
}

export const POOLS_CONFIG_BY_CHAIN = {
    [ChainId.PLEXCHAIN]: plexchainPools,
    [ChainId.BSC]: bscPools,
    [ChainId.BSC_TESTNET]: bscTestnetPools,
  } as PoolsConfigByChain<SupportedChainId>

  export const LIVE_POOLS_CONFIG_BY_CHAIN = {
    [ChainId.PLEXCHAIN]: plexchainLivePools,
    [ChainId.BSC]: bscLivePools,
    [ChainId.BSC_TESTNET]: bscTestnetLivePools,
  } as PoolsConfigByChain<SupportedChainId>

  export const getPoolsConfig = (chainId: ChainId) => {
    if (!isPoolsSupported(chainId)) {
      return undefined
    }
    return POOLS_CONFIG_BY_CHAIN[chainId]
  }

  export const getLivePoolsConfig = (chainId: ChainId) => {
    if (!isPoolsSupported(chainId)) {
      return undefined
    }
    return LIVE_POOLS_CONFIG_BY_CHAIN[chainId]
  }

  export const MAX_LOCK_DURATION = 31536000
  export const UNLOCK_FREE_DURATION = 604800
  export const ONE_WEEK_DEFAULT = 604800
  export const BOOST_WEIGHT = 20000000000000n
  export const DURATION_FACTOR = 31536000n
