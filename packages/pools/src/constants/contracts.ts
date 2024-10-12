import { ChainId } from '@plexswap/chains'
import { Address } from 'viem'

import { SupportedChainId } from './supportedChains'

export type ContractAddresses<T extends ChainId = SupportedChainId> = {
  [chainId in T]: Address
}

export const WAYA_VAULT = {
  [ChainId.BSC_TESTNET]: '0xd5C79Cd66D2CF28fd0c0b3A41a1ba6D25880D70F',
  [ChainId.BSC]:         '0x7899654d3C4f2eEe352c833BD3aBE67Fb18A4D71',
  [ChainId.PLEXCHAIN]:   '0xD521A6e16Ef1e26688cdD779da10376685B4858B',
} as const satisfies ContractAddresses<SupportedChainId>

export const WAYA_FLEXIBLE_VAULT = {
  [ChainId.BSC_TESTNET]: '0xA83F46C4700B368E15588d4778df4274075e2b55',
  [ChainId.BSC]:         '0xB584cA7F7774EB9a68E60C032C45f0Efe9539AFE',
  [ChainId.PLEXCHAIN]:   '0x9Ca28E70B28c72546dfc52E7b12C2dE3bAFc4205'
} as const satisfies ContractAddresses<SupportedChainId>
