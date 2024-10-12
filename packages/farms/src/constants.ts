import { ChainId } from '@plexswap/chains'
import uniq from 'lodash/uniq'

export const coreFarmSupportedChainId = [ ChainId.BSC, ChainId.BSC_TESTNET, ChainId.PLEXCHAIN] as const

export const extendedFarmSupportedChainId = [ ChainId.BSC, ChainId.BSC_TESTNET, ChainId.PLEXCHAIN] as const

export const allFarmSupportedChainId = uniq([...coreFarmSupportedChainId, ...extendedFarmSupportedChainId])

export const wayaSupportedChainId = [ChainId.BSC, ChainId.PLEXCHAIN] as const

export type TFarmAllSupportedChainId = (typeof allFarmSupportedChainId)[number]

export type TFarmCoreSupportedChainId = (typeof coreFarmSupportedChainId)[number]

export type TFarmExtendedSupportedChainId = (typeof extendedFarmSupportedChainId)[number]

export const chiefFarmerCoreAddresses = {
   [ChainId.BSC_TESTNET]:   '0xCa9F812Ba614E97b6D8EDC36eE0C1b2DbA35f062',
   [ChainId.BSC]:           '0x4D4408eA016357BB334eAd40F14dcF0dfd164Dbe',
   [ChainId.PLEXCHAIN]:     '0xE8816BBc9A2D55946408FF2e30D154d277328386',
} as const

// LOOKUP //
export const chiefFarmerExtendedAddresses = {
  [ChainId.PLEXCHAIN]: '0x0',
  [ChainId.BSC]: '0x25AA280c44052604866087bF12b1b84c8D396022',
  [ChainId.BSC_TESTNET]: '0xAC0e32C000b172AAF9D0003Ffc683708fddc738C',
} as const satisfies Record<TFarmExtendedSupportedChainId, string>

export const specialVaultAddresses = {
} as const

export const nativeStableLpMap = {
  [ChainId.BSC]: {
    address: '0x2C2643D51322738fC33f6588Cb28eDe3790094E1',
    wNative: 'WBNB',
    stable: 'BUSD',
  },
  [ChainId.BSC_TESTNET]: {
    address: '0x49120769a878215a350038AbB394072cEb6F4d4A',
    wNative: 'WBNB',
    stable: 'BUSD',
  },
  [ChainId.PLEXCHAIN]: {
    address: '0x8a233567a582de5110f03bdfe531fb6d1cb02969', 
    wNative: 'WPLEX',
    stable: 'USDP',
  },
}
