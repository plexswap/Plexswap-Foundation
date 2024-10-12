import { Token } from '@plexswap/sdk-core'
import { bscWarningTokens } from './warningTokens'

const { safemoon } = bscWarningTokens

interface WarningTokenList {
  [key: string]: Token
}

export const SwapWarningTokens = <WarningTokenList>{
  safemoon,
}


