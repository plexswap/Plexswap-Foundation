import { ERC20Token, WPLEX } from '@plexswap/sdk-core'
import { ChainId  } from '@plexswap/chains'
import { WAYA_PLEXCHAIN, PLEXF_PLEXCHAIN, USDP_PLEXCHAIN } from './common'

export const plexchainTokens = {
  // PLEX native here points to the wplex contract. Wherever the currency PLEX is required, conditional checks for the symbol 'BNB' can be used
  plex: new ERC20Token(
    ChainId.PLEXCHAIN,
    '0x50245424Afc53E67Ca1AAD2C90401568C0eFf53A',
    18,
    'PLEX',
    'PLEX',
    'https://swap.plexfinance.us',
  ),
  wplex: WPLEX[ChainId.PLEXCHAIN],
  waya:  WAYA_PLEXCHAIN,
  plexf: PLEXF_PLEXCHAIN,
  usdp:  USDP_PLEXCHAIN,
}
