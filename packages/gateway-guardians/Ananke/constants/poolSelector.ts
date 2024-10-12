import { ChainId } from '@plexswap/chains'
import { bscTokens } from '@plexswap/tokens'

import { PoolSelectorConfig, PoolSelectorConfigChainMap, TokenPoolSelectorConfigChainMap } from '../types'

export const DEFAULT_POOL_SELECTOR_CONFIG: PoolSelectorConfig = {
  topN: 2,
  topNDirectSwaps: 2,
  topNTokenInOut: 2,
  topNSecondHop: 1,
  topNWithEachBaseToken: 3,
  topNWithBaseToken: 3,
}

export const CORE_DEFAULT_POOL_SELECTOR_CONFIG: PoolSelectorConfigChainMap = {
  [ChainId.BSC]: {
    topN: 3,
    topNDirectSwaps: 2,
    topNTokenInOut: 2,
    topNSecondHop: 1,
    topNWithEachBaseToken: 3,
    topNWithBaseToken: 3,
  },
  [ChainId.BSC_TESTNET]: {
    topN: 3,
    topNDirectSwaps: 2,
    topNTokenInOut: 2,
    topNSecondHop: 1,
    topNWithEachBaseToken: 3,
    topNWithBaseToken: 3,
  },
  [ChainId.PLEXCHAIN]: {
    topN: 3,
    topNDirectSwaps: 2,
    topNTokenInOut: 2,
    topNSecondHop: 1,
    topNWithEachBaseToken: 3,
    topNWithBaseToken: 3,
  },
}

export const EXTENDED_DEFAULT_POOL_SELECTOR_CONFIG: PoolSelectorConfigChainMap = {
  [ChainId.BSC]: {
    topN: 2,
    topNDirectSwaps: 2,
    topNTokenInOut: 2,
    topNSecondHop: 1,
    topNWithEachBaseToken: 3,
    topNWithBaseToken: 4,
  },
  [ChainId.BSC_TESTNET]: {
    topN: 2,
    topNDirectSwaps: 2,
    topNTokenInOut: 2,
    topNSecondHop: 1,
    topNWithEachBaseToken: 3,
    topNWithBaseToken: 4,
  },
  [ChainId.PLEXCHAIN]: {
    topN: 2,
    topNDirectSwaps: 2,
    topNTokenInOut: 2,
    topNSecondHop: 1,
    topNWithEachBaseToken: 3,
    topNWithBaseToken: 4,
  },
}

// Use to configure pool selector config when getting quote from specific tokens
// Allow to increase or decrease the number of candidate pools to calculate routes from
export const EXTENDED_TOKEN_POOL_SELECTOR_CONFIG: TokenPoolSelectorConfigChainMap = {
  [ChainId.BSC]: {
    [bscTokens.plexf.address]: {
      topNTokenInOut: 4,
    },
  },
}

export const CORE_TOKEN_POOL_SELECTOR_CONFIG: TokenPoolSelectorConfigChainMap = {

}
