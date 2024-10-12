import { ChainId } from '@plexswap/chains'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import BigNumber from 'bignumber.js'
import { BSC_BLOCK_TIME, getPoolsConfig } from '../constants'
import { OnChainProvider, SerializedPool } from '../types'
import chunk from 'lodash/chunk'
import fromPairs from 'lodash/fromPairs'
import { erc20Abi } from 'viem'
import { cropChiefABI } from '../abi/CropChief'

const getLivePoolsWithEnd = async (chainId: ChainId) => {
  const poolsConfig = getPoolsConfig(chainId)
  if (!poolsConfig) {
    return null
  }
  return poolsConfig.filter((p) => p.poolId !== 0 && !p.isFinished)
}

const fetchPoolsBlockLimits = async (
  pools: SerializedPool[],
  chainId: ChainId,
  provider: OnChainProvider,
) => {
  if (!pools.length) {
    return []
  }
  const startEndBlockCalls = pools.flatMap(({ contractAddress }) => {
    return [
      {
        abi: cropChiefABI,
        address: contractAddress,
        functionName: 'startBlock',
      },
      {
        abi: cropChiefABI,
        address: contractAddress,
        functionName: 'bonusEndBlock',
      },
    ] as const
  })

  const client = provider({ chainId })

  const [block, startEndBlockRaw] = await Promise.all([
    client.getBlock({ blockTag: 'latest' }),
    client.multicall({
      contracts: startEndBlockCalls,
      allowFailure: false,
    }),
  ])

  const startEndBlockResult = startEndBlockRaw.reduce<bigint[][]>((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / 2)

    if (!resultArray[chunkIndex]) {
      // eslint-disable-next-line no-param-reassign
      resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].push(item)

    return resultArray
  }, [])

  const getTimestampFromBlock = (targetBlock: number) => {
    return Number(block.timestamp) + (targetBlock - Number(block.number)) * BSC_BLOCK_TIME
  }
  return pools.map((wayaPoolConfig, index) => {
    const [startBlock, endBlock] = startEndBlockResult[index]
    return {
      poolId: wayaPoolConfig.poolId,
      startTimestamp: getTimestampFromBlock(Number(startBlock)),
      endTimestamp: getTimestampFromBlock(Number(endBlock)),
    }
  })
}

export const fetchPoolsTimeLimits = async (chainId: ChainId, provider: OnChainProvider) => {
  const livedPools = await getLivePoolsWithEnd(chainId)
  if (!livedPools) {
    return null
  }
  const [poolLimits] = await Promise.all([
    fetchPoolsBlockLimits(livedPools, chainId, provider),
  ])
  return [...poolLimits]
}

export const fetchPoolsTotalStaking = async (chainId: ChainId, provider: OnChainProvider) => {
  const poolsConfig = getPoolsConfig(chainId)
  if (!poolsConfig) {
    return null
  }
  const poolsBalanceOf = poolsConfig.map(({ contractAddress, stakingToken }) => {
    return {
      abi: erc20Abi,
      address: stakingToken.address,
      functionName: 'balanceOf',
      args: [contractAddress],
    } as const
  })

  const client = provider({ chainId })
  const poolsTotalStaked = await client.multicall({
    contracts: poolsBalanceOf,
    allowFailure: false,
  })

  return poolsConfig.map((p, index) => ({
    poolId: p.poolId,
    totalStaked: new BigNumber(poolsTotalStaked[index].toString()).toJSON(),
  }))
}

interface FetchingPoolsStakingLimitsParams {
  poolsWithStakingLimit: number[]
  chainId: ChainId
  provider: OnChainProvider
}

export const fetchPoolsStakingLimitsByBlock = async ({
  poolsWithStakingLimit,
  chainId,
  provider,
}: FetchingPoolsStakingLimitsParams): Promise<{
  [key: string]: { stakingLimit: BigNumber; numberSecondsForUserLimit: number }
}> => {
  const poolsConfig = getPoolsConfig(chainId)
  if (!poolsConfig) {
    throw new Error(`No pools found on chain ${chainId}`)
  }

  const validPools = poolsConfig
    .filter((p) => p.stakingToken.symbol !== 'BNB' && !p.isFinished)
    .filter((p) => !poolsWithStakingLimit.includes(p.poolId))

  // Get the staking limit for each valid pool
  const poolStakingCalls = validPools
    .map(({ contractAddress }) => {
      return (['hasUserLimit', 'poolLimitPerUser', 'numberBlocksForUserLimit'] as const).map(
        (method) =>
          ({
            address: contractAddress,
            functionName: method,
            abi: cropChiefABI,
          } as const),
      )
    })
    .flat()

  const client = provider({ chainId })

  const poolStakingResultRaw = await client.multicall({
    contracts: poolStakingCalls,
    allowFailure: true,
  })

  const chunkSize = poolStakingCalls.length / validPools.length
  const poolStakingChunkedResultRaw = chunk(poolStakingResultRaw.flat(), chunkSize)
  return fromPairs(
    poolStakingChunkedResultRaw.map((stakingLimitRaw, index) => {
      const hasUserLimit = stakingLimitRaw[0]?.result as boolean
      const stakingLimit =
        hasUserLimit && stakingLimitRaw[1].result ? new BigNumber(stakingLimitRaw[1].result.toString()) : BIG_ZERO
      const numberBlocksForUserLimit = stakingLimitRaw[2].result ? Number(stakingLimitRaw[2].result) : 0
      const numberSecondsForUserLimit = numberBlocksForUserLimit * BSC_BLOCK_TIME
      return [validPools[index].poolId, { stakingLimit, numberSecondsForUserLimit }]
    }),
  )
}

export const fetchPoolsStakingLimits = async (
  params: FetchingPoolsStakingLimitsParams,
): Promise<{
  [key: string]: { stakingLimit: BigNumber; numberSecondsForUserLimit: number }
}> => {
  const [limitsByBlock] = await Promise.all([
    fetchPoolsStakingLimitsByBlock(params),
  ])
  return {
    ...limitsByBlock,
  }
}
