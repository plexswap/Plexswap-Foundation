import { plexchainTokens } from '@plexswap/tokens'
import { getAddress } from 'viem'
import { SerializedPool, PoolCategory } from '../../types'

export const livePools: SerializedPool[] = []
//.map((p) => ({
//  ...p,
//  contractAddress: getAddress(p.contractAddress),
//  stakingToken: p.stakingToken.serialize,
//  earningToken: p.earningToken.serialize,
//  }))   

// Known finished Silos (Pools)
export const finishedPools: SerializedPool[] = []
//.map((p) => ({
//  ...p,
//  isFinished: true,
//  contractAddress: getAddress(p.contractAddress),
//  stakingToken: p.stakingToken.serialize,
//  earningToken: p.earningToken.serialize,
//}))

export const pools: SerializedPool[] = [...livePools, ...finishedPools]
