import { ERC20Token } from '@plexswap/sdk-core'
import { ChainId  } from '@plexswap/chains'

export const WAYA_BSC = new ERC20Token(
  ChainId.BSC,
  '0x32d9F70F6eF86718A51021ad269522Abf4CFFE49',
  18,
  'WAYA',
  'PlexSwap Farm Token',
  'https://swap.plexfinance.us/',
)

export const WAYA_TESTNET = new ERC20Token(
  ChainId.BSC_TESTNET,
  '0xA2af2640A694f91632e60befc7Fc30C1b787D505',
  18,
  'WAYA',
  'PlexSwap Farm Token',
  'https://swap.plexfinance.us/',
)

export const WAYA_PLEXCHAIN = new ERC20Token(
  ChainId.PLEXCHAIN,
  '0x7589CF3115E060673FD0109fA6891464E13947A1',
  18,
  'WAYA',
  'PlexSwap Farm Token',
  'https://swap.plexfinance.us/',
)

export const PLEXF_BSC = new ERC20Token(
  ChainId.BSC,
  '0xBB472510B1896C6992D658a7Ab69F7dF32a37b3c',
  9,
  'PLEX-F',
  'Symplexia Finance Token',
  'https://swap.plexfinance.us/',
)

export const PLEXF_TESTNET = new ERC20Token(
  ChainId.BSC_TESTNET,
  '0xb7a3DFd16663dbA80c8f93338d1c59bA21680921',
  9,
  'PLEX-F',
  'Symplexia Finance Token',
  'https://swap.plexfinance.us/',
)

export const PLEXF_PLEXCHAIN = new ERC20Token(
  ChainId.PLEXCHAIN,
  '0xD0B07197d86434635fe30D69604751F3651c19a6',
  9,
  'PLEX-F',
  'Symplexia Finance Token',
  'https://swap.plexfinance.us/',
)

export const USDP_PLEXCHAIN = new ERC20Token(
  ChainId.PLEXCHAIN,
  '0x69D1D347088e8916aC107b6679927C4EC5faB4a0',
  18,
  'USDP',
  'Symplexia USD Coin',
  'https://swap.plexfinance.us/',
)

export const USDC_BSC = new ERC20Token(
  ChainId.BSC,
  '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  18,
  'USDC',
  'Binance-Peg USD Coin',
  'https://www.centre.io/usdc',
)

export const USDC_TESTNET = new ERC20Token(
  ChainId.BSC_TESTNET,
  '0x64544969ed7EBf5f083679233325356EbE738930',
  18,
  'USDC',
  'Binance-Peg USD Coin',
  'https://www.centre.io/usdc',
)

export const USDT_BSC = new ERC20Token(
  ChainId.BSC,
  '0x55d398326f99059fF775485246999027B3197955',
  18,
  'USDT',
  'Tether USD',
  'https://tether.to/',
)

export const BUSD_BSC = new ERC20Token(
  ChainId.BSC,
  '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  18,
  'BUSD',
  'Binance USD',
  'https://www.paxos.com/busd/',
)

export const BUSD_TESTNET = new ERC20Token(
  ChainId.BSC_TESTNET,
  '0x8516Fc284AEEaa0374E66037BD2309349FF728eA',
  18,
  'BUSD',
  'Binance USD',
  'https://www.paxos.com/busd/',
)

export const PLEXF = {
  [ChainId.BSC]: PLEXF_BSC,
  [ChainId.BSC_TESTNET]: PLEXF_TESTNET,
  [ChainId.PLEXCHAIN]: PLEXF_PLEXCHAIN,
}

export const WAYA = {
  [ChainId.BSC]: WAYA_BSC,
  [ChainId.BSC_TESTNET]: WAYA_TESTNET,
  [ChainId.PLEXCHAIN]: WAYA_PLEXCHAIN,
}

export const BUSD = {
  [ChainId.BSC]: BUSD_BSC,
  [ChainId.BSC_TESTNET]: BUSD_TESTNET,
}

export const USDC = {
  [ChainId.BSC]: USDC_BSC,
  [ChainId.BSC_TESTNET]: USDC_TESTNET,
}

export const USDT = {
  [ChainId.BSC]: USDT_BSC,
}

export const USDP = {
  [ChainId.PLEXCHAIN]: USDP_PLEXCHAIN,
}

export const STABLE_COIN = {
  [ChainId.BSC]: USDT[ChainId.BSC],
  [ChainId.BSC_TESTNET]: BUSD[ChainId.BSC_TESTNET],
  [ChainId.PLEXCHAIN]: USDP[ChainId.PLEXCHAIN],
}
