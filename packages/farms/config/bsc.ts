import { bscTokens, WAYA_BSC } from '@plexswap/tokens'
import { FeeAmount } from '@plexswap/sdk-extended'
import { getAddress } from 'viem'
import { SerializedFarmConfig, FarmConfigExtended } from './../src'
import { defineFarmExtendedConfigs } from '../src/defineFarmExtendedConfigs'

const farms: SerializedFarmConfig[] = [
   /**
   * These 3 farms (PID 0, 1, 2) should always be at the top of the file.
   */
  {
    pid: 0,
    lpSymbol: 'WAYA',
    lpAddress:  WAYA_BSC.address,
    token: bscTokens.waya,
    quoteToken: bscTokens.wbnb,
  },
  {
    pid: 1,
    lpSymbol: 'WAYA/BNB LP',
    lpAddress:  '0xB459DC2D3763b14c77a5657f6A3C328E2A59255F',
    token: bscTokens.waya,
    quoteToken: bscTokens.wbnb,
    boosted: true,
  },
  {
    pid: 2,
    lpSymbol: 'BUSD/BNB LP',
    lpAddress:  '0x2C2643D51322738fC33f6588Cb28eDe3790094E1',
    token: bscTokens.busd,
    quoteToken: bscTokens.wbnb,
  },
  {
    pid: 3,
    lpSymbol: 'WAYA/BUSD LP',
    lpAddress:  '0x3660F1Ee5711c69160061e55169136631Aa84D6C',
    token: bscTokens.waya,
    quoteToken: bscTokens.busd,
    boosted: true,
  },
  {
    pid: 4,
    lpSymbol: 'PLEX-F/BNB LP',
    lpAddress: '0x539Df50cf6fc29d560413d669A5Bb78cB342029B',
    token: bscTokens.plexf,
    quoteToken: bscTokens.wbnb,
  },
  {
    pid: 5,
    lpSymbol: 'PLEX-F/BUSD LP',
    lpAddress: '0x626f4248e1116f1168B53f6183b2569c7D0fc723',
    token: bscTokens.plexf,
    quoteToken: bscTokens.busd,
  },
  {
    pid: 8,
    lpSymbol: 'USDT-WBNB LP',
    lpAddress: '0xeFD1F48EA0e2F4346034b03a4d1FFBb405407811',
    token: bscTokens.usdt, 
    quoteToken: bscTokens.wbnb, 
  },

  {
    pid: 6,
    lpSymbol: 'USDT-WBNB LP',
    lpAddress: '0x9c47AF6db545cE3B9BEc337FEBfD919f4Fd35743',
    token: bscTokens.usdt, // coins[0]
    quoteToken: bscTokens.wbnb, // coins[1]
    stableSwapAddress: '0x1db5871AB93e5464Ae65D17353B5d5471086300B',
    infoStableSwapAddress: '0x16682C6103A598Fa64eC8087A439dFA37F02A71C',
    stableLpFee: 0.0002,
    stableLpFeeRateOfTotalFee: 0.5,
  },
  {
    pid: 7,
    lpSymbol: 'USDT-BUSD LP',
    lpAddress: '0xB70370E2346B35Cb0914D216Cc4a43491CB180DD',
    token: bscTokens.usdt, // coins[0]
    quoteToken: bscTokens.busd, // coins[1]
    stableSwapAddress: '0x6fc75530F09b60b0e71CeEC8776d9d7192B31990',
    infoStableSwapAddress: '0x16682C6103A598Fa64eC8087A439dFA37F02A71C',
    stableLpFee: 0.0002,
    stableLpFeeRateOfTotalFee: 0.5,
  },

].map((p) => ({
  ...p,
  token: p.token.serialize,
  quoteToken: p.quoteToken.serialize,
  lpAddress: getAddress(p.lpAddress),
}))

const extendedTopFixedLps: FarmConfigExtended[] = [
  {
    pid: 1,
    token0: bscTokens.usdt,
    token1: bscTokens.wbnb,
    lpAddress: '0x894BfaEBCc9d22a078593d2E655851567BcD847a',
    feeAmount: FeeAmount.LOWEST,
  },
]

export const farmsExtended = defineFarmExtendedConfigs([
  ...extendedTopFixedLps,
  // new lps should follow after the top fixed lps
  // latest first
  {
    pid: 2,
    token0: bscTokens.waya,
    token1: bscTokens.wbnb,
    lpAddress: '0x55E934705d2254A186b9e4698f160111Ce9ABf7b',
    feeAmount: FeeAmount.LOWEST,
  },
 ])

export default farms