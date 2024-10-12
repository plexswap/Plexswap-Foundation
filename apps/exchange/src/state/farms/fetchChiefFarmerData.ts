import { ChainId } from '@plexswap/chains'
import { SerializedFarm, SerializedFarmConfig } from '@plexswap/farms'
import { chiefFarmerABI } from 'config/abi/ChiefFarmer'
import chunk from 'lodash/chunk'
import { farmFetcher } from 'state/farms'
import { notEmpty } from 'utils/notEmpty'
import { publicClient } from 'utils/wagmi'
import { AbiStateMutability, ContractFunctionReturnType } from 'viem'
import { getChiefFarmerAddress } from '../../utils/addressHelpers'

export const fetchChiefFarmerFarmPoolLength = async (chainId: number) => {
  try {
    const client = publicClient({ chainId })
    const chiefFarmerAddress = getChiefFarmerAddress(chainId)
    const poolLength = chiefFarmerAddress
      ? await client.readContract({
          abi: chiefFarmerABI,
          address: chiefFarmerAddress,
          functionName: 'poolLength',
        })
      : 0n

    return Number(poolLength)
  } catch (error) {
    console.error('Fetch ChiefFarmer Farm Pool Length Error: ', error)
    return 0
  }
}

const chiefFarmerFarmCalls = (farm: SerializedFarm) => {
  const { pid, quoteToken } = farm
  const multiCallChainId = farmFetcher.isTestnet(quoteToken.chainId) ? ChainId.BSC_TESTNET : ChainId.BSC
  const chiefFarmerAddress = getChiefFarmerAddress(multiCallChainId)
  const chiefFarmerPid = pid

  return chiefFarmerAddress && (chiefFarmerPid || chiefFarmerPid === 0)
    ? ([
        {
          abi: chiefFarmerABI,
          address: chiefFarmerAddress,
          functionName: 'poolInfo',
          args: [chiefFarmerPid],
        },
        {
          abi: chiefFarmerABI,
          address: chiefFarmerAddress,
          functionName: 'totalRegularAllocPoint',
        },
      ] as const)
    : ([null, null] as const)
}

export type PoolInfo = ContractFunctionReturnType<typeof chiefFarmerABI, AbiStateMutability, 'poolInfo'>
export type TotalRegularAllocPoint = ContractFunctionReturnType<
  typeof chiefFarmerABI,
  AbiStateMutability,
  'totalRegularAllocPoint'
>

export const fetchChiefFarmerData = async (
  farms: SerializedFarmConfig[],
  chainId: number,
): Promise<[PoolInfo | null, TotalRegularAllocPoint | null][]> => {
  const chiefFarmerCalls = farms.map((farm) => chiefFarmerFarmCalls(farm))
  const chunkSize = chiefFarmerCalls.flat().length / farms.length
  const chiefFarmerAggregatedCalls = chiefFarmerCalls
    .filter((chiefFarmerCall) => chiefFarmerCall[0] !== null && chiefFarmerCall[1] !== null)
    .flat()
    .filter(notEmpty)

  const multiCallChainId = farmFetcher.isTestnet(chainId) ? ChainId.BSC_TESTNET : ChainId.BSC
  const client = publicClient({ chainId: multiCallChainId })
  const chiefFarmerMultiCallResult = await client.multicall({
    contracts: chiefFarmerAggregatedCalls,
    allowFailure: false,
  })

  const chiefFarmerChunkedResultRaw = chunk(chiefFarmerMultiCallResult, chunkSize)

  let chiefFarmerChunkedResultCounter = 0
  return chiefFarmerCalls.map((chiefFarmerCall) => {
    if (chiefFarmerCall[0] === null && chiefFarmerCall[1] === null) {
      return [null, null]
    }
    const data = chiefFarmerChunkedResultRaw[chiefFarmerChunkedResultCounter] as [PoolInfo, TotalRegularAllocPoint]
    chiefFarmerChunkedResultCounter++
    return data
  })
}
