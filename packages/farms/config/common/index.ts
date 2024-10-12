import { ChainId } from '@plexswap/chains'
import { ERC20Token } from '@plexswap/sdk-core'
import {
    bscTestnetTokens,
    bscTokens,
    plexchainTokens
 } from '@plexswap/tokens'
import type { TFarmExtendedSupportedChainId } from '../../src'
import type { CommonPrice } from '../../src/fetchFarmsExtended'


export type PriceHelper = {
  chain: string
  list: ERC20Token[]
}

export const priceHelperTokens = {
  [ChainId.PLEXCHAIN]: {
    chain: 'plexchain',
    list: [plexchainTokens.wplex, plexchainTokens.usdp],
  },
  [ChainId.BSC]: {
    chain: 'bsc',
    list: [bscTokens.wbnb, bscTokens.usdt, bscTokens.busd],
  },
} satisfies Record<number, PriceHelper>

// For testing purposes
export const DEFAULT_COMMON_PRICE: Record<TFarmExtendedSupportedChainId, CommonPrice> = {
  [ChainId.PLEXCHAIN]: {},
  [ChainId.BSC]: {},
  [ChainId.BSC_TESTNET]: {
    [bscTestnetTokens.wbnb.address]: '1',
    [bscTestnetTokens.busd.address]: '1',
    [bscTestnetTokens.usdc.address]: '1',
  },
}