import { bscTestnetTokens } from '@plexswap/tokens'
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
    lpAddress: '0xA2af2640A694f91632e60befc7Fc30C1b787D505', // Waya Address
    token: bscTestnetTokens.waya,
    quoteToken: bscTestnetTokens.wbnb,
  },
  {
    pid: 1,
    lpSymbol: 'WAYA/BNB LP',
    lpAddress:  '0xb2f17C22DB21b82449e73AD605A74dff66C16aeF', // WAYA-LP Pair
    token: bscTestnetTokens.waya,
    quoteToken: bscTestnetTokens.wbnb,
  },
  {
    pid: 2,
    lpSymbol: 'BUSD/BNB LP',
    lpAddress:  '0x49120769a878215a350038AbB394072cEb6F4d4A',
    token: bscTestnetTokens.busd,
    quoteToken: bscTestnetTokens.wbnb,
  },
  {
    pid: 3,
    lpSymbol: 'WAYA/BUSD LP',
    lpAddress:  '0x92AaD8AC7da29516ece348b3703679920c5a94E7',
    token: bscTestnetTokens.waya,
    quoteToken: bscTestnetTokens.busd,
  },
  {
    pid: 4,
    lpSymbol: 'PLEX-F/BNB LP',
    lpAddress:  '0x22aE89104C0A2a0792568b8CDf5A7806249d6e90', 
    token: bscTestnetTokens.plexf,
    quoteToken: bscTestnetTokens.wbnb,
  },
  {
    pid: 5,
    lpSymbol: 'PLEX-F/BUSD LP',
    lpAddress:  '0x98BE7F94d796d14630f425B4748B9eBDC26bdBf7', 
    token: bscTestnetTokens.plexf,
    quoteToken: bscTestnetTokens.busd,
  },
  {
    pid: 9,
    lpSymbol: 'USDT-WBNB LP',
    lpAddress: '0xC81Fb08f341C5a4b8894f0B3d3f1A69eBF7d3cf8',
    token: bscTestnetTokens.usdt, // coins[0]
    quoteToken: bscTestnetTokens.wbnb, // coins[1]
    stableSwapAddress: '0x3F81828aE64143038119B6e094aFfEFdf9471a65',
    infoStableSwapAddress: '0x7956c89A966E90DE55A94bEa98dE28c75F4A4C36',
    stableLpFee: 0.0002,
    stableLpFeeRateOfTotalFee: 0.5,
  },
  {
    pid: 10,
    lpSymbol: 'USDT-BUSD LP',
    lpAddress: '0xD66E7914FD99F4F7Cca906C0ac7dbaC010D3b804',
    token: bscTestnetTokens.usdt, // coins[0]
    quoteToken: bscTestnetTokens.busd, // coins[1]
    stableSwapAddress: '0xB71752dBA19593c9478919FAe528ba60E8937a71',
    infoStableSwapAddress: '0x7956c89A966E90DE55A94bEa98dE28c75F4A4C36',
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
    lpAddress: '0x4451B3745A12CC5d21DA111077008531c3af1074',
    token0: bscTestnetTokens.usdt,
    token1: bscTestnetTokens.wbnb,
    feeAmount: FeeAmount.LOWEST,
  },
]

export const farmsExtended = defineFarmExtendedConfigs([
  ...extendedTopFixedLps,
  // New LPs should follow after the top fixed lps
  // latest first
  {
    pid: 2,
    token0: bscTestnetTokens.waya,
    token1: bscTestnetTokens.wbnb,
    lpAddress: '0xF899807Eeebea91926f8EdA6d8D4622F2641b587',
    feeAmount: FeeAmount.LOWEST,
  },
  {
    pid: 3,
    token0: bscTestnetTokens.busd,
    token1: bscTestnetTokens.wbnb,
    lpAddress: '0x438f50d5e4409B889183dB8c6fF7C7eE8eC6bBed',
    feeAmount: FeeAmount.LOWEST,
  },
  {
    pid: 4,
    token0: bscTestnetTokens.busd,
    token1: bscTestnetTokens.wbnb,
    lpAddress: '0xb991d477f9Bc146ea5b0ED1dFea14ba1Db3EE689',
    feeAmount: FeeAmount.LOW,
  },
  {
    pid: 5,
    token0: bscTestnetTokens.plexf,
    token1: bscTestnetTokens.wbnb,
    lpAddress: '0x851F713b606c7800a91F6E036C53AC394B661190',
    feeAmount: FeeAmount.LOW,
  },
  {
    pid: 6,
    token0: bscTestnetTokens.busd,
    token1: bscTestnetTokens.waya,
    lpAddress: '0xe365c7D660716a986c7158975EF6b9205aCB59AF',
    feeAmount: FeeAmount.LOWEST,
  }, 
 ])

export default farms
