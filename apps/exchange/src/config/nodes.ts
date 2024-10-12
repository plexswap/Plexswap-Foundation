import { ChainId } from '@plexswap/chains'
import { getNodeRealUrl } from 'utils/node/nodeReal'
import { getPoktUrl } from 'utils/node/pokt'

export const SERVER_NODES = {
  [ChainId.BSC]: [
    process.env.NEXT_PUBLIC_NODE_PRODUCTION || '',
    getPoktUrl(ChainId.BSC, process.env.NEXT_PUBLIC_POKT_API_KEY) || '',
    'https://bsc.publicnode.com',
    'https://binance.llamarpc.com',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed1.binance.org',
  ].filter(Boolean),

  [ChainId.BSC_TESTNET]: ['https://data-seed-prebsc-1-s1.binance.org:8545'],

  [ChainId.PLEXCHAIN]: ['https://plex-rpc.plexfinance.us'],
 
} satisfies Record<ChainId, readonly string[]>

export const PUBLIC_NODES = {
  [ChainId.BSC]: [
    process.env.NEXT_PUBLIC_NODE_PRODUCTION || '',
    getNodeRealUrl(ChainId.BSC, process.env.NEXT_PUBLIC_NODE_REAL_API_ETH) || '',
    process.env.NEXT_PUBLIC_NODIES_BSC || '',
    getPoktUrl(ChainId.BSC, process.env.NEXT_PUBLIC_POKT_API_KEY) || '',
    'https://bsc.publicnode.com',
    'https://binance.llamarpc.com',
    'https://bsc-dataseed1.defibit.io',
    'https://bsc-dataseed1.binance.org',
  ].filter(Boolean),

  [ChainId.BSC_TESTNET]: ['https://data-seed-prebsc-1-s1.binance.org:8545'],

  [ChainId.PLEXCHAIN]: ['https://plex-rpc.plexfinance.us'],

} satisfies Record<ChainId, readonly string[]>