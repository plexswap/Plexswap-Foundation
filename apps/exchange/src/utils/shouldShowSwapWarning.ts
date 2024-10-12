import { ChainId } from '@plexswap/chains'
import { Token } from '@plexswap/sdk-core'
import { SwapWarningTokens } from '@plexswap/tokens'

const shouldShowSwapWarning = (chainId: ChainId | undefined, swapCurrency: Token): boolean => {
  if (chainId && SwapWarningTokens[chainId]) {
    const swapWarningTokens = Object.values(SwapWarningTokens[chainId])
    return swapWarningTokens.some((warningToken) => warningToken.equals(swapCurrency))
  }

  return false
}

export default shouldShowSwapWarning
