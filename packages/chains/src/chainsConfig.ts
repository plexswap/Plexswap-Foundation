import { type Chain } from 'viem'
import { bsc, bscTestnet } from 'viem/chains'


export const plexchain = {
  id: 1149,
  name: 'Plexchain',
  nativeCurrency: {
    decimals: 18,
    name: 'Plexchain Native Token',
    symbol: 'PLEX'
  },
  rpcUrls: {
    public:  { http: ['https://plex-rpc.plexfinance.us/'] },
    default: { http: ['https://plex-rpc.plexfinance.us/'] }
  },
  blockExplorers: {
    default: { name: 'PlexScan', url: 'https://explorer.plexfinance.us' }
  },
  contracts: {
    multicall3: {
        address: '0x2210e34629E5B17B5F2D875a76098223d71F1D3E',
        blockCreated: 455863,
    },
  }
} as const satisfies Chain

export { bsc, bscTestnet }

export const CHAINS: [Chain, ...Chain[]] = [ bsc, bscTestnet, plexchain ]