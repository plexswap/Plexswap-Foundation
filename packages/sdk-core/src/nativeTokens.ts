import { ChainId } from '@plexswap/chains'
import { ERC20Token } from './entities/token-extends'

export const WETH9 = {
  [ChainId.BSC]: new ERC20Token(
    ChainId.BSC,
    '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    18,
    'ETH',
    'Binance-Peg Ethereum Token',
    'https://ethereum.org',
  ),
  [ChainId.BSC_TESTNET]: new ERC20Token(
    ChainId.BSC,
    '0xE7bCB9e341D546b66a46298f4893f5650a56e99E',
    18,
    'ETH',
    'ETH',
    'https://ethereum.org',
  ),
  [ChainId.PLEXCHAIN]: new ERC20Token(
    ChainId.PLEXCHAIN,
    '0x50245424Afc53E67Ca1AAD2C90401568C0eFf53A',
    18,
    'WPLEX',
    'Wrapped Plex',
    'https://swap.plexfinance.us'
  ),
  }
  
  export const WBNB = {
    [ChainId.BSC]: new ERC20Token(
      ChainId.BSC,
      '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      18,
      'WBNB',
      'Wrapped BNB',
      'https://www.binance.org'
    ),
    [ChainId.BSC_TESTNET]: new ERC20Token(
      ChainId.BSC_TESTNET,
      '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
      18,
      'WBNB',
      'Wrapped BNB',
      'https://www.binance.org'
    ),
  }

  export const WPLEX = {
    [ChainId.PLEXCHAIN]: new ERC20Token(
      ChainId.PLEXCHAIN,
      '0x50245424Afc53E67Ca1AAD2C90401568C0eFf53A',
      18,
      'WPLEX',
      'Wrapped Plex',
      'https://swap.plexfinance.us'
    ),
  }
  
  export const WNATIVE = {
    [ChainId.BSC]: WBNB[ChainId.BSC],
    [ChainId.BSC_TESTNET]: WBNB[ChainId.BSC_TESTNET],
    [ChainId.PLEXCHAIN]: WPLEX[ChainId.PLEXCHAIN],
  } satisfies Record<ChainId, ERC20Token>
  
  export const NATIVE = {
    [ChainId.BSC]: { name: 'Binance Chain Native Token', symbol: 'BNB', decimals: 18 },
    [ChainId.BSC_TESTNET]: { name: 'Binance Chain Native Token', symbol: 'BNB', decimals: 18 },
    [ChainId.PLEXCHAIN]: { name: 'Plexchain Native Token', symbol: 'PLEX', decimals: 18 },
  } satisfies Record<
  ChainId,
  {
    name: string
    symbol: string
    decimals: number
  }
>

  