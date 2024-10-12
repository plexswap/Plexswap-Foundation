import { ChainId } from '@plexswap/chains'

import { WAYA_FLEXIBLE_VAULT, WAYA_VAULT } from '../constants/contracts'
import { getContractAddress } from '../utils'

export function getWayaFlexibleVaultAddress(chainId: ChainId) {
  return getContractAddress(WAYA_FLEXIBLE_VAULT, chainId)
}

export function getWayaVaultAddress(chainId: ChainId) {
  return getContractAddress(WAYA_VAULT, chainId)
}
