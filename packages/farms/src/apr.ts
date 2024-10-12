import { BigintIsh, ZERO } from '@plexswap/sdk-core'
import { formatFraction, parseNumberToFraction } from '@plexswap/utils/formatFractions'
import BN from 'bignumber.js'

type BigNumberish = BN | number | string

interface FarmAprParams {
  poolWeight: BigNumberish
  // Total tvl staked in farm in usd
  tvlUsd: BigNumberish
  wayaPriceUsd: BigNumberish
  wayaPerSecond: BigNumberish

  precision?: number
}

const SECONDS_FOR_YEAR = 365 * 60 * 60 * 24

const isValid = (num: BigNumberish) => {
  const bigNumber = new BN(num)
  return bigNumber.isFinite() && bigNumber.isPositive()
}

const formatNumber = (bn: BN, precision: number) => {
  return formatFraction(parseNumberToFraction(bn.toNumber(), precision), precision)
}

export function getFarmApr({ poolWeight, tvlUsd, wayaPriceUsd, wayaPerSecond, precision = 6 }: FarmAprParams) {
  if (!isValid(poolWeight) || !isValid(tvlUsd) || !isValid(wayaPriceUsd) || !isValid(wayaPerSecond)) {
    return '0'
  }

  const wayaRewardPerYear = new BN(wayaPerSecond).times(SECONDS_FOR_YEAR)
  const farmApr = new BN(poolWeight).times(wayaRewardPerYear).times(wayaPriceUsd).div(tvlUsd).times(100)

  if (farmApr.isZero()) {
    return '0'
  }

  return formatNumber(farmApr, precision)
}

export interface PositionFarmAprParams extends Omit<FarmAprParams, 'tvlUsd'> {
  // Position liquidity
  liquidity: BigintIsh

  // Total staked liquidity in farm
  totalStakedLiquidity: BigintIsh

  // Position tvl in usd
  positionTvlUsd: BigNumberish
}

export function getPositionFarmApr({
  poolWeight,
  positionTvlUsd,
  wayaPriceUsd,
  wayaPerSecond,
  liquidity,
  totalStakedLiquidity,
  precision = 6,
}: PositionFarmAprParams) {
  const aprFactor = getPositionFarmAprFactor({
    poolWeight,
    wayaPriceUsd,
    wayaPerSecond,
    liquidity,
    totalStakedLiquidity,
  })
  if (!isValid(aprFactor) || !isValid(positionTvlUsd)) {
    return '0'
  }

  const positionApr = aprFactor.times(liquidity.toString()).div(positionTvlUsd)

  return formatNumber(positionApr, precision)
}

export function getPositionFarmAprFactor({
  poolWeight,
  wayaPriceUsd,
  wayaPerSecond,
  liquidity,
  totalStakedLiquidity,
}: Omit<PositionFarmAprParams, 'positionTvlUsd' | 'precision'>) {
  if (
    !isValid(poolWeight) ||
    !isValid(wayaPriceUsd) ||
    !isValid(wayaPerSecond) ||
    BigInt(liquidity) === ZERO ||
    BigInt(totalStakedLiquidity) === ZERO
  ) {
    return new BN(0)
  }

  const wayaRewardPerYear = new BN(wayaPerSecond).times(SECONDS_FOR_YEAR)
  const aprFactor = new BN(poolWeight)
    .times(wayaRewardPerYear)
    .times(wayaPriceUsd)
    .div((BigInt(liquidity) + BigInt(totalStakedLiquidity)).toString())
    .times(100)

  return aprFactor
}
