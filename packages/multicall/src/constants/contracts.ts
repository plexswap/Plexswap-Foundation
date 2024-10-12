import { ChainId } from '@plexswap/chains'
import { Address } from 'viem'

export const MULTICALL_ADDRESS: { [key in ChainId]?: Address } = {
  [ChainId.BSC]: '0x39eecaE833c944ebb94942Fa44CaE46e87a8Da17',

  // Testnets
  [ChainId.BSC_TESTNET]: '0xeeF6ff30cF5D5b8aBA0DE16A01d17A0697a275b5',
}

export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11'

export const MULTICALL3_ADDRESSES: {
  [key in ChainId]?: Address
} = {
  [ChainId.BSC]: MULTICALL3_ADDRESS,
  [ChainId.BSC_TESTNET]: MULTICALL3_ADDRESS,
  [ChainId.PLEXCHAIN]:    '0x2210e34629E5B17B5F2D875a76098223d71F1D3E',
}

export const multicalAddresses = {
  [ChainId.BSC]:          MULTICALL3_ADDRESS,
  [ChainId.BSC_TESTNET]:  MULTICALL3_ADDRESS,
  [ChainId.PLEXCHAIN]:    '0x2210e34629E5B17B5F2D875a76098223d71F1D3E',
} as const
