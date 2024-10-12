import { BOOST_WEIGHT, DURATION_FACTOR } from '@plexswap/pools'
import { getFullDecimalMultiplier } from '@plexswap/utils/getFullDecimalMultiplier'
import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { useWayaVault } from 'state/pools/hooks'

import { DEFAULT_TOKEN_DECIMAL } from 'config'
import formatSecondsToWeeks, { secondsToWeeks } from '../../utils/formatSecondsToWeeks'

const ZERO = new BigNumber(0)
const ONE = new BigNumber(1)

export default function useAvgLockDuration() {
  const { totalLockedAmount, totalShares, totalWayaInVault, pricePerFullShare } = useWayaVault()

  const avgLockDurationsInSeconds = useMemo(() => {
    const flexibleWayaAmount = totalWayaInVault?.minus(totalLockedAmount || ZERO)
    const flexibleWayaShares = flexibleWayaAmount?.div(pricePerFullShare || ONE).times(DEFAULT_TOKEN_DECIMAL)
    const lockedWayaBoostedShares = totalShares?.minus(flexibleWayaShares || ZERO)
    const lockedWayaOriginalShares = totalLockedAmount?.div(pricePerFullShare || ONE).times(DEFAULT_TOKEN_DECIMAL)
    const avgBoostRatio = lockedWayaBoostedShares?.div(lockedWayaOriginalShares || ONE)

    return (
      Math.round(
        avgBoostRatio
          ?.minus(1)
          .times(new BigNumber(DURATION_FACTOR.toString()))
          .div(new BigNumber(BOOST_WEIGHT.toString()).div(getFullDecimalMultiplier(12)))
          .toNumber() ?? 0,
      ) || 0
    )
  }, [totalWayaInVault, totalLockedAmount, pricePerFullShare, totalShares])

  const avgLockDurationsInWeeks = useMemo(
    () => formatSecondsToWeeks(avgLockDurationsInSeconds),
    [avgLockDurationsInSeconds],
  )

  const avgLockDurationsInWeeksNum = useMemo(
    () => secondsToWeeks(avgLockDurationsInSeconds),
    [avgLockDurationsInSeconds],
  )

  return {
    avgLockDurationsInWeeks,
    avgLockDurationsInWeeksNum,
    avgLockDurationsInSeconds,
  }
}
