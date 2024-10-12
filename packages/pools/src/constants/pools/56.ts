import { bscTokens } from '@plexswap/tokens'
import { getAddress } from 'viem'
import { SerializedPool, PoolCategory } from '../../types'

export const livePools: SerializedPool[] = [
  {
    poolId: 0,
    stakingToken: bscTokens.waya,
    earningToken: bscTokens.waya,
    contractAddress: '0x4D4408eA016357BB334eAd40F14dcF0dfd164Dbe',     // chiefFarmerAddress
    poolCategory: PoolCategory.CORE,
    tokenPerBlock: '10',
    isFinished: false,
  }, 
  {
    poolId: 1,
    stakingToken: bscTokens.waya,
    earningToken: bscTokens.plexf,
    contractAddress: '0x0d1b5d6216c45fd8198814ecf247930758c55ab5',    // CropChiefAddress
    poolCategory: PoolCategory.CORE,
    tokenPerBlock: '0.00115',
  },
].map((p) => ({
  ...p,
  contractAddress: getAddress(p.contractAddress),
  stakingToken: p.stakingToken.serialize,
  earningToken: p.earningToken.serialize,
}))

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
