import { ChainId } from '@plexswap/chains'

import { ContractAddresses } from '../constants/contracts'
import { isPoolsSupported } from './../constants'

export function getContractAddress(addresses: ContractAddresses, chainId: ChainId) {
  if (!isPoolsSupported(chainId)) {
    throw new Error(`Cannot get contract address. Unsupported chain ${chainId}`)
  }
  return addresses[chainId]
}
