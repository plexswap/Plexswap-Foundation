import { ChainId } from '@plexswap/chains'
import { Address, Hash } from 'viem'

export const FACTORY_ADDRESS_BSC = '0x580B12Fcc6247E7bA7a02324Ea6Aa6604d0BEC7A'
export const INIT_CODE_HASH_BSC = '0xf38c13cd4dac7b7a54178d2832fe7f9ff6e71d8063d032326d6bb4c85fcbd0d5'

export const FACTORY_ADDRESS_MAP: Record<number, Address> = {
  [ChainId.BSC]: FACTORY_ADDRESS_BSC,
  [ChainId.BSC_TESTNET]:  '0x551291a1A69CbE46EAfE4F45703360AF992987A6',
  [ChainId.PLEXCHAIN]:  '0x34759072BfFe88f2800DFe01e4bb7C8dE581883A',
}

export const INIT_CODE_HASH_MAP: Record<number, Hash> = {
  [ChainId.BSC]: INIT_CODE_HASH_BSC,
  [ChainId.BSC_TESTNET]:'0x0ac3000920e9b3c229fdd8305aa7b28c16e5d16c66e4983a4e2ff27aff8e4b53',
  [ChainId.PLEXCHAIN]:'0x13fb8b827d28b6458445d06479e8df7ce9053cd3a1347afddf07da59f431d939',
}
