import { ERC20Token, Token } from '@plexswap/sdk-core'
import { bscTokens, plexchainTokens  } from '@plexswap/tokens'
import omitBy from 'lodash/omitBy'
import slice from 'lodash/slice'
import { publicClient } from 'utils/wagmi'
import { describe, it } from 'vitest'
import { erc20Abi } from 'viem'

const whitelist = ['deprecated_tusd', 'deprecated_rpg', 'deprecated_mix']

// remove BNB because it's not a Bep20 token
// remove ONE because there are two tokens with the symbol ONE (Harmony ONE and BigONE)
// remove HERO because there are two tokens with the symbol HERO (StepHero and Hero)
// remove aBNBc because the token has been exploited
const bscTokensToTest = omitBy(
  bscTokens,
  (token) =>
    token.symbol.toLowerCase() === 'bnb' ||
    token.symbol.toLowerCase() === 'one' ||
    token.symbol.toLowerCase() === 'bttold' ||
    token.symbol.toLowerCase() === 'abnbc' ||
    token.symbol.toLowerCase() === 'hero',
)
const tokenListsToTest: [Record<string, ERC20Token>, Record<string, ERC20Token>] = [bscTokensToTest, plexchainTokens]

const tokenTables: [string, ERC20Token][] = tokenListsToTest.reduce(
  (acc, cur) => [...acc, ...Object.entries(cur)],
  [] as [string, ERC20Token][],
)

describe.concurrent(
  'Config tokens',
  () => {
    it.each(slice(tokenTables, tokenTables.length - 50))(
      'Token %s has the correct key, symbol, and decimal',
      async (key: string, token: Token) => {
        const client = publicClient({ chainId: token.chainId })
        const [symbol, decimals] = await client.multicall({
          contracts: [
            {
              abi: erc20Abi,
              address: token.address,
              functionName: 'symbol',
            },
            {
              abi: erc20Abi,
              address: token.address,
              functionName: 'decimals',
            },
          ],
          allowFailure: false,
        })

        const isWhitelisted = whitelist.includes(key.toLowerCase())
        if (!isWhitelisted) expect(key.toLowerCase()).toBe(token.symbol.toLowerCase())
        if (!isWhitelisted) expect(token.symbol.toLowerCase()).toBe(symbol.toLowerCase())
        expect(token.decimals).toBe(decimals)
      },
    )
  },
  {
    timeout: 50_000,
  },
)
