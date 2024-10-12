import { ChainId } from '@plexswap/chains'
import { YEAR_IN_SECONDS } from '@plexswap/utils/getTimePeriods'
import BigNumber from 'bignumber.js'
import { BLOCKS_PER_YEAR } from 'config'
import lpAprs56 from 'config/constants/lpAprs/56.json'

const getLpApr = (chainId?: number) => {
  switch (chainId) {
    case ChainId.BSC:
      return lpAprs56
    default:
      return {}
  }
}

/**
 * Get the APR value in %
 * @param stakingTokenPrice Token price in the same quote currency
 * @param rewardTokenPrice Token price in the same quote currency
 * @param totalStaked Total amount of stakingToken in the pool
 * @param tokenPerBlock Amount of new waya allocated to the pool for each new block
 * @returns Null if the APR is NaN or infinite.
 */
export const getPoolApr = (
  stakingTokenPrice: number | null,
  rewardTokenPrice: number | null,
  totalStaked: number | null,
  tokenPerBlock: number | null,
): number | null => {
  if (stakingTokenPrice === null || rewardTokenPrice === null || totalStaked === null || tokenPerBlock === null) {
    return null
  }

  const totalRewardPricePerYear = new BigNumber(rewardTokenPrice).times(tokenPerBlock).times(BLOCKS_PER_YEAR)
  const totalStakingTokenInPool = new BigNumber(stakingTokenPrice).times(totalStaked)
  const apr = totalRewardPricePerYear.div(totalStakingTokenInPool).times(100)
  return apr.isNaN() || !apr.isFinite() ? null : apr.toNumber()
}

const BIG_NUMBER_NAN = new BigNumber(NaN)

/**
 * Get farm APR value in %
 * @param chainId
 * @param poolWeight allocationPoint / totalAllocationPoint
 * @param wayaPriceUsd Waya price in USD
 * @param poolLiquidityUsd Total pool liquidity in USD
 * @param farmAddress Farm Address
 * @param regularWayaPerBlock
 * @returns Farm Apr
 */
export const getFarmApr = (
  chainId: number | undefined,
  poolWeight: BigNumber | null | undefined,
  wayaPriceUsd: BigNumber | null,
  poolLiquidityUsd: BigNumber | null | undefined,
  farmAddress: string | null,
  regularWayaPerBlock: number,
  wayaPerSecFromWaya?: number,
): { wayaRewardsApr: number | null; lpRewardsApr: number } => {
  const yearlyWayaRewardAllocation = wayaPerSecFromWaya
    ? new BigNumber(wayaPerSecFromWaya).times(YEAR_IN_SECONDS)
    : poolWeight
    ? poolWeight.times(BLOCKS_PER_YEAR * regularWayaPerBlock)
    : new BigNumber(NaN)
  const wayaRewardsApr = yearlyWayaRewardAllocation
    .times(wayaPriceUsd || BIG_NUMBER_NAN)
    .div(poolLiquidityUsd || BIG_NUMBER_NAN)
    .times(100)
  let wayaRewardsAprAsNumber: number | null = null
  if (!wayaRewardsApr.isNaN() && wayaRewardsApr.isFinite()) {
    wayaRewardsAprAsNumber = wayaRewardsApr.toNumber()
  }
  const lpRewardsApr = farmAddress
    ? (getLpApr(chainId)[farmAddress?.toLowerCase()] || getLpApr(chainId)[farmAddress]) ?? 0
    : 0 // can get both checksummed or lowercase
  return { wayaRewardsApr: wayaRewardsAprAsNumber, lpRewardsApr }
}

export default null