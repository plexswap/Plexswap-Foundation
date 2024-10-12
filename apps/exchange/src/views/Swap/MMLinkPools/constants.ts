import { ChainId } from '@plexswap/chains'
import contract from 'config/constants/contracts'
import { getAddress } from 'viem'

export const NATIVE_CURRENCY_ADDRESS = getAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')

export const MM_SUPPORT_CHAIN = {
  1: true,
  5: true,
  56: true,
}

export const MM_SWAP_CONTRACT_ADDRESS = contract.mmLinkedPool

export const MM_STABLE_TOKENS_WHITE_LIST: Record<number, Record<string, string>> = {
  [ChainId.PLEXCHAIN]: {
    '0x69D1D347088e8916aC107b6679927C4EC5faB4a0': 'USDP',
  },
  [ChainId.BSC]: {
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56': 'BUSD',
    '0x55d398326f99059fF775485246999027B3197955': 'USDT',
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d': 'USDC',
  },
}

export const MM_SIGNER = {
  [ChainId.BSC]: { 1: '0xff8Ba4D1fC3762f6154cc942CCF30049A2A0cEC6', 
                   2: '0xe68290F7FAEeB35648B5440D644A80d82766E03d' },
  [ChainId.PLEXCHAIN]: { 1: '0x0' },
}

export const SAFE_MM_QUOTE_EXPIRY_SEC = 25
export const IS_SUPPORT_NATIVE_TOKEN = true
