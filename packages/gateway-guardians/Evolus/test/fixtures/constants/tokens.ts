import { ChainId } from '@plexswap/chains'
import { ERC20Token } from '@plexswap/sdk-core'
import * as Tokens from '@plexswap/tokens'
import { zeroAddress } from 'viem'

const MockToken: Record<ChainId, ERC20Token> = (() => {
  const tokens: Record<ChainId, ERC20Token> = {} as Record<ChainId, ERC20Token>

  for (const chainId in ChainId) {
    if (!Number.isNaN(Number(chainId))) {
      const id = Number(chainId) as unknown as ChainId
      tokens[id] = new ERC20Token(id, zeroAddress, 18, 'MockToken')
    }
  }

  return tokens
})()

export const USDP = {
  ...MockToken,
  ...Tokens.USDP,
}

export const USDT = {
  ...MockToken,
  ...Tokens.USDT,
}
export const USDC = {
  ...MockToken,
  ...Tokens.USDC,
 }

export const BUSD = {
  ...MockToken,
  ...Tokens.BUSD,
}

export const WBNB = {
  ...MockToken,
  [ChainId.BSC]: Tokens.bscTokens.wbnb,
}
