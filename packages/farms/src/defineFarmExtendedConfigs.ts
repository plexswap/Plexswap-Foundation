import { Token, WNATIVE } from '@plexswap/sdk-core'
import { WAYA, unwrappedToken } from '@plexswap/tokens'
import { priceHelperTokens } from '../config/common'
import { ComputedFarmConfigExtended, FarmConfigExtended } from './types'

function sortFarmLP(token0: Token, token1: Token) {
  const commonTokens = priceHelperTokens[token0.chainId as keyof typeof priceHelperTokens]
  if (commonTokens) {
    const commonTokensList = [
      WNATIVE[token0.chainId as keyof typeof WNATIVE],
      ...commonTokens.list,
      WAYA[token0.chainId as keyof typeof WAYA] ? WAYA[token0.chainId as keyof typeof WAYA] : undefined,
    ].filter(Boolean) as Token[]
    const someToken0 = commonTokensList.some((token) => token.equals(token0))
    const someToken1 = commonTokensList.some((token) => token.equals(token1))
    if (someToken0 && someToken1) {
      return commonTokensList.indexOf(token0) > commonTokensList.indexOf(token1) ? [token0, token1] : [token1, token0]
    }
    if (someToken0) {
      return [token1, token0]
    }
    if (someToken1) {
      return [token0, token1]
    }
  }

  return [token0, token1]
}

export function defineFarmExtendedConfigs(farmConfig: FarmConfigExtended[]): ComputedFarmConfigExtended[] {
  return farmConfig.map((config) => {
    const [token, quoteToken] = sortFarmLP(config.token0, config.token1)
    const unwrappedToken0 = unwrappedToken(token)
    const unwrappedToken1 = unwrappedToken(quoteToken)
 
    if (!unwrappedToken0 || !unwrappedToken1) {
      throw new Error(`Invalid farm config token0: ${token.address} or token1: ${quoteToken.address}`)
    }

    return {
      ...config,
      token,
      quoteToken,
      lpSymbol: `${unwrappedToken0.symbol}-${unwrappedToken1.symbol} LP`,  
    }
  })
}
