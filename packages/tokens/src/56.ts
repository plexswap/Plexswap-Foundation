import { ERC20Token, WBNB } from '@plexswap/sdk-core'
import { ChainId  } from '@plexswap/chains'
import { BUSD_BSC, WAYA_BSC, PLEXF_BSC, USDT_BSC, USDC_BSC } from './common'

export const bscTokens = {
  // bnb here points to the wbnb contract. Wherever the currency BNB is required, conditional checks for the symbol 'BNB' can be used
  bnb: new ERC20Token(
    ChainId.BSC,
    '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    18,
    'BNB',
    'BNB',
    'https://www.binance.com/',
  ),
  wbnb: WBNB[ChainId.BSC],
  waya: WAYA_BSC,
  plexf: PLEXF_BSC,
  busd: BUSD_BSC,
  usdc: USDC_BSC,
  usdt: USDT_BSC,

  dai: new ERC20Token(
    ChainId.BSC,
    '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
    18,
    'DAI',
    'Dai Stablecoin',
    'https://www.makerdao.com/',
  ),
   btcb: new ERC20Token(
    ChainId.BSC,
    '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    18,
    'BTCB',
    'Binance BTC',
    'https://bitcoin.org/',
  ),
  ust: new ERC20Token(
    ChainId.BSC,
    '0x23396cF899Ca06c4472205fC903bDB4de249D6fC',
    18,
    'UST',
    'Wrapped UST Token',
    'https://mirror.finance/',
  ),
  eth: new ERC20Token(
    ChainId.BSC,
    '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    18,
    'ETH',
    'Binance-Peg Ethereum Token',
    'https://ethereum.org/en/',
  ),
  ctk: new ERC20Token(
    ChainId.BSC,
    '0xA8c2B8eec3d368C0253ad3dae65a5F2BBB89c929',
    6,
    'CTK',
    'Certik Token',
    'https://www.certik.foundation/',
  ),
  ada: new ERC20Token(
    ChainId.BSC,
    '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',
    18,
    'ADA',
    'Binance-Peg Cardano Token',
    'https://www.cardano.org/',
  ),
  doge: new ERC20Token(
    ChainId.BSC,
    '0xbA2aE424d960c26247Dd6c32edC70B295c744C43',
    8,
    'DOGE',
    'Binance-Peg Dogecoin',
    'https://dogecoin.com/',
  ),
  ankr: new ERC20Token(
    ChainId.BSC,
    '0xf307910A4c7bbc79691fD374889b36d8531B08e3',
    18,
    'ANKR',
    'Ankr',
    'https://www.ankr.com/',
  ),
}
