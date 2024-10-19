import { ChainId, BLOCKS_SUBGRAPHS, EXTENDED_SUBGRAPHS, STABLESWAP_SUBGRAPHS, CORE_SUBGRAPHS } from '@plexswap/chains'

export const ASSET_CDN = 'https://assets.plexfinance.us';

export const SNAPSHOT_BASE_URL = process.env.NEXT_PUBLIC_SNAPSHOT_BASE_URL
export const SNAPSHOT_API = `${SNAPSHOT_BASE_URL}/graphql`
export const SNAPSHOT_HUB_API = `${SNAPSHOT_BASE_URL}/api/message`

export const INFO_CLIENT = 'https://api.studio.thegraph.com/query/31296/plexswap/version/latest'
export const BLOCKS_CLIENT = BLOCKS_SUBGRAPHS[ChainId.BSC]

export const BIT_QUERY = 'https://graphql.bitquery.io'
export const GRAPH_HEALTH = 'https://api.thegraph.com/index-node/graphql'

export const FARMS_API = 'https://farms-api.plexfinance.us'

// LOOKUP //
export const QUOTING_API_PREFIX = `${process.env.NEXT_PUBLIC_QUOTING_API}/order-price`
export const QUOTING_API = `${QUOTING_API_PREFIX}/get-price`
export const ACCESS_RISK_API = process.env.NEXT_PUBLIC_ACCESS_RISK_API
export const ONRAMP_API_BASE_URL = process.env.NEXT_PUBLIC_ONRAMP_API_BASE_URL 
export const CELER_API = 'https://api.celerscan.com/scan'
export const INFO_CLIENT_WITH_CHAIN = { [ChainId.BSC]: 'https://proxy-api.plexfinance.us/bsc-exchange'}
    
export const CORE_SUBGRAPH_URLS = {
  ...CORE_SUBGRAPHS,
}

export const EXTENDED_SUBGRAPH_URLS = {
  ...EXTENDED_SUBGRAPHS,
}

export const STABLESWAP_SUBGRAPHS_URLS = {
  ...STABLESWAP_SUBGRAPHS,
}

export const BLOCKS_CLIENT_WITH_CHAIN = BLOCKS_SUBGRAPHS