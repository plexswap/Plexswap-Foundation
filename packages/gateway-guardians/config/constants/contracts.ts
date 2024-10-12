import { ChainId } from '@plexswap/chains'
import { Address } from 'viem'
import { ChainMap } from '../types'

export const ROUTER_ADDRESS: ChainMap<string> = {
  [ChainId.BSC]: '0x205ce30FB7Ef4173f05979421a73Def4f6983C47',
  [ChainId.BSC_TESTNET]: '0x995214A87ADAdbe30e7132BC269AF996004BA48D',
  [ChainId.PLEXCHAIN]: '0x7E961C57bFEE77716d1E46D2e942347CfdEaD8DF',
}
// LOOKUP //
export const SMART_ROUTER_ADDRESSES = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0xaA8eDF290123E0C94C6F5B74EE771c394337B803',
  [ChainId.BSC_TESTNET]: '0xcfEbCdB909c74C5eD7342Db656f620E86d7D536f'
} as const satisfies Record<ChainId, string>
// LOOKUP //
export const EVOLUS_ROUTER_ADDRESSES: Record<ChainId, Address> = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0x1A0A18AC4BECDDbd6389559687d1A73d8927E416',
  [ChainId.BSC_TESTNET]: '0xd77C2afeBf3dC665af07588BF798bd938968c72E',

}
// LOOKUP //
export const STABLE_SWAP_INFO_ADDRESS: ChainMap<string> = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0x37dEa8F642b8d8bdB1e3a8697Ab35DE07C37EeC6',
  [ChainId.BSC_TESTNET]: '0x7f802f3e2AF210763E940AE5557aa988daeC3e6C'
}
// LOOKUP //
export const MIXED_ROUTE_QUOTER_ADDRESSES = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0x6916265bEbc706B789C6A234f736355d0cf5C6B3',
  [ChainId.BSC_TESTNET]: '0x2FA60cf7573a4e2314258Cf39bA36F1666092EE2',
} as const satisfies Record<ChainId, Address>
// LOOKUP //
export const EXTENDED_QUOTER_ADDRESSES = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0xD581E934277309d3A5B5473CC2E01593163b1403',
  [ChainId.BSC_TESTNET]: '0x108a2e26eC676fe40B96A17051D78e0d9d3C8297',
} as const satisfies Record<ChainId, Address>

export const feeOnTransferDetectorAddresses = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0x003BD52f589F23346E03fA431209C29cD599d693',
  [ChainId.BSC_TESTNET]: '0xE83BD854c1fBf54424b4d914163BF855aB1131Aa',

} as const