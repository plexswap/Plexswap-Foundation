import { bscTestnetTokens } from '@plexswap/tokens'

import { StableSwapPool } from './types'


export const pools: StableSwapPool[] = [
  {
    lpSymbol: 'USDT-WBNB LP',
    lpAddress: '0xC81Fb08f341C5a4b8894f0B3d3f1A69eBF7d3cf8',              // PlexStableSwapLP
    token: bscTestnetTokens.usdt, // coins[0]
    quoteToken: bscTestnetTokens.wbnb, // coins[1]
    stableSwapAddress: '0x3F81828aE64143038119B6e094aFfEFdf9471a65',      // PlexStableSwapTwoPool
    infoStableSwapAddress: '0x7956c89A966E90DE55A94bEa98dE28c75F4A4C36',  // PlexStableSwapTwoPoolInfo
    stableLpFee: 0.0004,
    stableLpFeeRateOfTotalFee: 0.5,
  },
  {
    lpSymbol: 'USDT-BUSD LP',
    lpAddress: '0xD66E7914FD99F4F7Cca906C0ac7dbaC010D3b804',              // PlexStableSwapLP
    token: bscTestnetTokens.usdt, // coins[0]
    quoteToken: bscTestnetTokens.busd, // coins[1]
    stableSwapAddress: '0xB71752dBA19593c9478919FAe528ba60E8937a71',      // PlexStableSwapTwoPool
    infoStableSwapAddress: '0x7956c89A966E90DE55A94bEa98dE28c75F4A4C36',  // PlexStableSwapTwoPoolInfo
    stableLpFee: 0.0004,
    stableLpFeeRateOfTotalFee: 0.5,
  },
]
