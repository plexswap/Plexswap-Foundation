import { ChainId } from '@plexswap/chains'
import { Token } from '@plexswap/sdk-core'
import { bscWarningTokens } from 'config/constants/warningTokens'

const {  safemoon,  } = bscWarningTokens

interface WarningTokenList {
  [chainId: number]: {
    [key: string]: Token
  }
}

const SwapWarningTokens = <WarningTokenList>{
  [ChainId.BSC]: {
    safemoon,
  },
}

export default SwapWarningTokens
