import { ERC20Token, WBNB } from '@plexswap/sdk-core'
import { ChainId  } from '@plexswap/chains'
import { BUSD_TESTNET, WAYA_TESTNET, PLEXF_TESTNET, USDC_TESTNET  } from './common'

export const bscTestnetTokens = {
  // bnb here points to the wbnb contract. Wherever the currency BNB is required, conditional checks for the symbol 'BNB' can be used
  bnb: new ERC20Token(
    ChainId.BSC_TESTNET,
    '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    18,
    'BNB',
    'BNB',
    'https://www.binance.com/',
  ),
  wbtc: new ERC20Token(
    ChainId.BSC_TESTNET, 
    '0xfC8bFbe9644e1BC836b8821660593e7de711e564', 
    8, 
    'WBTC', 
    'Wrapped BTC'
  ),
  usdt: new ERC20Token(
    ChainId.BSC_TESTNET, 
    '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', 
    18, 
    'USDT', 
    'Tether USD'
  ),

  mockB: new ERC20Token(ChainId.BSC_TESTNET, '0x828E3FC56dD48E072e3B6F3C4FD4DDB4733c2C5e', 18, 'MOCK B', 'MOCK B'),
  mockA: new ERC20Token(ChainId.BSC_TESTNET, '0xc1eD9955C11585F47d0d6BfBC29034349A746a81', 18, 'MOCK A', 'MOCK A'),
  mockUSDT : new ERC20Token(ChainId.BSC_TESTNET,'0x0fB5D7c73FA349A90392f873a4FA1eCf6a3d0a96',18,'USDT','MOCK Token'),
  
  wbnb:  WBNB[ChainId.BSC_TESTNET],
  waya:  WAYA_TESTNET,
  busd:  BUSD_TESTNET,
  plexf: PLEXF_TESTNET,
  usdc:  USDC_TESTNET,}
