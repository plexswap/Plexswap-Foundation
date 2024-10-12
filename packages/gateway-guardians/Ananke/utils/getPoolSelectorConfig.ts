import { Currency } from '@plexswap/sdk-core'

import {
    DEFAULT_POOL_SELECTOR_CONFIG,
    EXTENDED_DEFAULT_POOL_SELECTOR_CONFIG,
    EXTENDED_TOKEN_POOL_SELECTOR_CONFIG,
    CORE_DEFAULT_POOL_SELECTOR_CONFIG,
    CORE_TOKEN_POOL_SELECTOR_CONFIG,
} from './../../Ananke/constants'
import { PoolSelectorConfig, PoolSelectorConfigChainMap, TokenPoolSelectorConfigChainMap } from '../types'
import { mergePoolSelectorConfig } from './mergePoolSelectorConfig'

function poolSelectorConfigFactory(
  poolSelecorConfigMap: PoolSelectorConfigChainMap,
  tokenPoolSelectorConfigMap: TokenPoolSelectorConfigChainMap,
) {
  return function getPoolSelectorConfig(currencyA?: Currency, currencyB?: Currency): PoolSelectorConfig {
    const chainId = currencyA?.chainId
    if (!chainId || !poolSelecorConfigMap[chainId]) {
      return DEFAULT_POOL_SELECTOR_CONFIG
    }

    const additionalConfigA = tokenPoolSelectorConfigMap[chainId]?.[currencyA?.wrapped?.address || '0x']
    const additionalConfigB = tokenPoolSelectorConfigMap[chainId]?.[currencyB?.wrapped?.address || '0x']

    return mergePoolSelectorConfig(
      mergePoolSelectorConfig(poolSelecorConfigMap[chainId], additionalConfigA),
      additionalConfigB,
    )
  }
}

export const getExtendedPoolSelectorConfig = poolSelectorConfigFactory(
  EXTENDED_DEFAULT_POOL_SELECTOR_CONFIG,
  EXTENDED_TOKEN_POOL_SELECTOR_CONFIG,
)

export const getCorePoolSelectorConfig = poolSelectorConfigFactory(
  CORE_DEFAULT_POOL_SELECTOR_CONFIG,
  CORE_TOKEN_POOL_SELECTOR_CONFIG,
)
