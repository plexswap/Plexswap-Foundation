import { ChainId } from '@plexswap/chains'
import { ERC20Token } from '@plexswap/sdk-core'

export const WALLCHAIN_ENABLED = true

export const WallchainKeys = {
  bsc: process.env.NEXT_PUBLIC_WALLCHAIN_BSC_KEY,
} as { [key: string]: string }

export const WallchainTokens = [
  new ERC20Token(ChainId.BSC, '0x31A89807b669BD6A69F1A619977aAF4dF981fE6a', 18, 'SMPX'),
]
