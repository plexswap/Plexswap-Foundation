import { bscTokens } from '@plexswap/tokens'

import { StableSwapPool } from './types'

export const pools: StableSwapPool[] = [
  {
    lpSymbol: 'USDT-WBNB LP',
    lpAddress: '0x9c47AF6db545cE3B9BEc337FEBfD919f4Fd35743',                // PlexStableSwapLP
    token: bscTokens.usdt,                                                  // coins[0]
    quoteToken: bscTokens.wbnb,                                             // coins[1]
    stableSwapAddress: '0x1db5871AB93e5464Ae65D17353B5d5471086300B',        // PlexStableSwapTwoPool
    infoStableSwapAddress: '0x16682C6103A598Fa64eC8087A439dFA37F02A71C',    // PlexStableSwapTwoPoolInfo  
    stableLpFee: 0.0004,
    stableLpFeeRateOfTotalFee: 0.5,
  },
  {
    lpSymbol: 'USDT-BUSD LP',
    lpAddress: '0xB70370E2346B35Cb0914D216Cc4a43491CB180DD',
    token: bscTokens.usdt,
    quoteToken: bscTokens.busd,
    stableSwapAddress: '0x6fc75530F09b60b0e71CeEC8776d9d7192B31990',
    infoStableSwapAddress: '0x16682C6103A598Fa64eC8087A439dFA37F02A71C',
    stableLpFee: 0.0004,
    stableLpFeeRateOfTotalFee: 0.5,
  },
]
