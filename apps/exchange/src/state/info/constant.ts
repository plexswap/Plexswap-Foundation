import { ChainId } from '@plexswap/chains'
import { BLOCKS_CLIENT } from 'config/constants/endpoints'
import { BSC_TOKEN_WHITELIST, PCS_V2_START, PLEX_TOKEN_BLACKLIST, PLEX_TOKEN_WHITELIST, TOKEN_BLACKLIST } from 'config/constants/info'
import { SUPPORT_CHAINLINK } from 'config/constants/supportedChains'
import { GraphQLClient } from 'graphql-request'
import mapValues from 'lodash/mapValues'
import { infoStableSwapClients, coreClients } from 'utils/graphql'
import { bsc } from 'wagmi/chains'

export type MultiChainName = 'BSC' | 'PLEXCHAIN'

export type MultiChainNameExtend = MultiChainName | 'BSC_TESTNET'

export const multiChainName: Record<number | string, MultiChainNameExtend> = {
  [ChainId.BSC]: 'BSC',
  [ChainId.PLEXCHAIN]: 'PLEXCHAIN',
  [ChainId.BSC_TESTNET]: 'BSC_TESTNET',
}

export const multiChainShortName: Record<number, string> = {
}

export const multiChainQueryMainToken: Record<MultiChainName, string> = {
  BSC: 'BNB',
  PLEXCHAIN: 'PLEX'
}

export const multiChainBlocksClient: Record<MultiChainNameExtend, string> = {
  BSC: BLOCKS_CLIENT,
  BSC_TESTNET: 'https://api.thegraph.com/subgraphs/name/lengocphuc99/bsc_testnet-blocks',
  PLEXCHAIN: '',
}

export const multiChainStartTime = {
  BSC: PCS_V2_START,
}

export const multiChainId: Record<MultiChainName, ChainId> = {
  BSC: ChainId.BSC,
  PLEXCHAIN: ChainId.PLEXCHAIN
}

export const multiChainPaths = {
  [ChainId.BSC]: '',
  [ChainId.PLEXCHAIN]: '/plexchain',
}

export const multiChainQueryStableClient = {
  BSC: infoStableSwapClients[ChainId.BSC],
}

export const STABLESWAP_SUBGRAPHS_START_BLOCK = {
}

export const multiChainScan: Record<MultiChainName, string> = {
  BSC: bsc.blockExplorers.default.name,
  PLEXCHAIN: ''
}

export const multiChainTokenBlackList: Record<MultiChainName, string[]> = mapValues(
  {
    BSC: TOKEN_BLACKLIST,
    PLEXCHAIN: PLEX_TOKEN_BLACKLIST
  },
  (val) => val.map((address) => address.toLowerCase()),
)

export const multiChainTokenWhiteList: Record<MultiChainName, string[]> = mapValues(
  {
    BSC: BSC_TOKEN_WHITELIST,
    PLEXCHAIN: PLEX_TOKEN_WHITELIST
  },
  (val) => val.map((address) => address.toLowerCase()),
)

export const getMultiChainQueryEndPointWithStableSwap = (chainName: MultiChainNameExtend): GraphQLClient => {
  const isStableSwap = checkIsStableSwap()
  if (isStableSwap) return multiChainQueryStableClient[chainName]
  return coreClients[multiChainId[chainName]]
}

export const subgraphTokenName = {
  [ChainId.BSC]: {
    '0x738d96Caf7096659DB4C1aFbf1E1BDFD281f388C': 'Ankr Staked MATIC',
  },
}

export const subgraphTokenSymbol = {
  [ChainId.BSC]: {
    '0x14016E85a25aeb13065688cAFB43044C2ef86784': 'TUSDOLD',
  },
}

export const checkIsStableSwap = () => window.location.href.includes('stableSwap')

export const ChainLinkSupportChains = SUPPORT_CHAINLINK