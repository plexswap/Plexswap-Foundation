import { ChainId } from '@plexswap/chains'

export const SUPPORTED_CHAIN_IDS = [
    ChainId.BSC,
    ChainId.BSC_TESTNET,
    ChainId.PLEXCHAIN
  ] as const

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number]

export function isPoolsSupported(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId)
}

  

