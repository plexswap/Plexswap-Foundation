import { ChainId, testnetChainIds } from '@plexswap/chains'
import { getPoolsConfig, SerializedPool, getPoolContractByPoolId } from '@plexswap/pools'
import { SUPPORTED_CHAIN_IDS } from 'config/constants/supportedChains'
import { publicClient } from 'utils/wagmi'
import { Address, formatUnits } from 'viem'
import { describe, it } from 'vitest'

describe.concurrent(
  'Config pools',
  () => {
    for (const chainId of SUPPORTED_CHAIN_IDS.filter((chainId_) => !testnetChainIds.includes(chainId_))) {
      const pools = getPoolsConfig(chainId) ?? []
      // Pool 0 is special (waya pool)
      // Pool 78 is a broken pool, not used, and break the tests
      const idsToRemove = chainId === ChainId.BSC ? [0, 78] : chainId === ChainId.BSC_TESTNET ? [0] : []
      // Test only against the last 10 pools, for performance concern
      const poolsToTest = pools.filter((pool) => !idsToRemove.includes(pool.poolId)).slice(0, 10)

      it.each<number>(pools.map((pool) => pool.poolId))('Pool #%d has an unique poolId', (poolId) => {
        const duplicates = pools.filter((p) => poolId === p.poolId)
        expect(duplicates).toHaveLength(1)
      })
      it.each<[number, Address]>(pools.map((pool) => [pool.poolId, pool.contractAddress]))(
        'Pool #%d has an unique contract address',
        (_, contractAddress) => {
          const duplicates = pools.filter((p) => contractAddress === p.contractAddress)
          expect(duplicates).toHaveLength(1)
        },
      )
      it.each<SerializedPool>(poolsToTest.filter((pool) => pool.earningToken.symbol !== 'BNB'))(
        'Pool %p has the correct earning token',
        async (pool) => {
          const contract = getPoolContractByPoolId({
            poolId: pool.poolId,
            chainId,
            publicClient: publicClient({ chainId }),
          })
          const rewardTokenAddress = await contract.read.rewardToken()
          expect(rewardTokenAddress.toLowerCase()).toBe(pool.earningToken.address.toLowerCase())
        },
        10000,
      )
      it.each<SerializedPool>(poolsToTest.filter((pool) => pool.stakingToken.symbol !== 'BNB'))(
        'Pool %p has the correct staking token',
        async (pool) => {
          let stakingTokenAddress: null | Address = null
          try {
            const contract = getPoolContractByPoolId({
              poolId: pool.poolId,
              chainId,
              publicClient: publicClient({ chainId }),
            })
            stakingTokenAddress = await contract.read.stakedToken()
          } catch (error) {
            const contract = getPoolContractByPoolId({
              poolId: pool.poolId,
              chainId,
              publicClient: publicClient({ chainId }),
            })
            stakingTokenAddress = await contract.read.syrup()
          }

          expect(stakingTokenAddress).toBeDefined()
          expect(stakingTokenAddress?.toLowerCase()).toBe(pool.stakingToken.address.toLowerCase())
        },
        10000,
      )

      it.each<SerializedPool>(poolsToTest.filter((pool) => pool.stakingToken.symbol !== 'BNB'))(
        'Pool %p has the correct tokenPerBlock',
        async (pool) => {
          const contract = getPoolContractByPoolId({
            poolId: pool.poolId,
            chainId,
            publicClient: publicClient({ chainId }),
          })
            const rewardPerBlock = await contract.read.rewardPerBlock()

            expect(String(parseFloat(formatUnits(rewardPerBlock, pool.earningToken.decimals)))).toBe(pool.tokenPerBlock)
         
        },
        10000,
      )
    }
  },
  { timeout: 60_000 },
)
