import { ChainId } from '@plexswap/chains'
import {
    BIT_QUERY,
    CORE_SUBGRAPH_URLS,
    EXTENDED_SUBGRAPH_URLS,
    STABLESWAP_SUBGRAPHS_URLS,
} from 'config/constants/endpoints'
import { GraphQLClient } from 'graphql-request'

export const infoClient = new GraphQLClient(CORE_SUBGRAPH_URLS[ChainId.BSC])



export const infoStableSwapClients = {
  [ChainId.BSC]: new GraphQLClient(STABLESWAP_SUBGRAPHS_URLS[ChainId.BSC]),
}

export const coreClients = {
  [ChainId.BSC]: new GraphQLClient(CORE_SUBGRAPH_URLS[ChainId.BSC]),

}

export const extendedClients = {
  [ChainId.BSC]: new GraphQLClient(EXTENDED_SUBGRAPH_URLS[ChainId.BSC]),
}

export const extendedInfoClients = { ...extendedClients, }

export const stableSwapClient = new GraphQLClient(STABLESWAP_SUBGRAPHS_URLS[ChainId.BSC])

export const bitQueryServerClient = new GraphQLClient(BIT_QUERY, {
  headers: {
    // only server, no `NEXT_PUBLIC` not going to expose in client
    'X-API-KEY': process.env.BIT_QUERY_HEADER || '',
  },
  timeout: 5000,
})