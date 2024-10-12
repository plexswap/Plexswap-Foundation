import { ChainId } from '@plexswap/chains'
import { ERC20Token } from '@plexswap/sdk-core'

export const bscWarningTokens = {
  safemoon: new ERC20Token(
    ChainId.BSC,
    '0x8076C74C5e3F5852037F31Ff0093Eeb8c8ADd8D3',
    9,
    'SAFEMOON',
    'Safemoon Token',
    'https://safemoon.net/',
  ),
}
