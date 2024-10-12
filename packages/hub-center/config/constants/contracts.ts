import { ChainId } from '@plexswap/chains'
import { Address } from 'viem'

export const PERMIT2_ADDRESSES: Record<ChainId, Address> = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0x31c2F6fcFf4F8759b3Bd5Bf0e1084A055615c768',
  [ChainId.BSC_TESTNET]: '0x31c2F6fcFf4F8759b3Bd5Bf0e1084A055615c768',
}


