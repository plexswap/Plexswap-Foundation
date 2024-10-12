import { ChainId, bscTestnet, bsc, plexchain } from '@plexswap/chains'
import { allFarmSupportedChainId } from '@plexswap/farms'

export const SUPPORT_ONLY_BSC           = [ChainId.BSC]
export const SUPPORT_BUY_CRYPTO         = [ChainId.BSC]
export const SUPPORT_POOLS              = [ChainId.BSC, ChainId.BSC_TESTNET]
export const RESTRICTED_FEATURE         = [ChainId.BSC, ChainId.PLEXCHAIN]
export const SUPPORT_CHAINLINK          = [ChainId.BSC, ChainId.BSC_TESTNET,ChainId.PLEXCHAIN]

export const SUPPORT_FARMS              = allFarmSupportedChainId

export const VALID_CHAINS               = [ bsc, bscTestnet, plexchain ]

export const SUPPORTED_CHAIN_IDS        = [ChainId.BSC, ChainId.BSC_TESTNET, ChainId.PLEXCHAIN ] as const

export const FIXED_STAKING_SUPPORTED_CHAINS = [ChainId.BSC] 
export const ACCESS_TOKEN_SUPPORT_CHAIN_IDS = [ChainId.BSC]
export const STABLE_SUPPORT_CHAIN_IDS       = [ChainId.BSC_TESTNET, ChainId.BSC]
