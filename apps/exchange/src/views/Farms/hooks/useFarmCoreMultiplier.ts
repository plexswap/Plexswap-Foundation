import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import BigNumber from 'bignumber.js'
import { BSC_BLOCK_TIME } from 'config'
import { useCallback, useMemo } from 'react'
import { useFarms } from 'state/farms/hooks'

export function useFarmCoreMultiplier() {
  const { regularWayaPerBlock, totalRegularAllocPoint } = useFarms()

  const totalMultipliers = useMemo(
    () => (Number.isFinite(+totalRegularAllocPoint) ? (+totalRegularAllocPoint / 10).toString() : '-'),
    [totalRegularAllocPoint],
  )

  return {
    totalMultipliers,
    getFarmWayaPerSecond: useCallback(
      (poolWeight?: BigNumber) => {
        const farmWayaPerSecondNum =
          poolWeight && regularWayaPerBlock ? poolWeight.times(regularWayaPerBlock).dividedBy(BSC_BLOCK_TIME) : BIG_ZERO

        const farmWayaPerSecond = farmWayaPerSecondNum.isZero()
          ? '0'
          : farmWayaPerSecondNum.lt(0.000001)
          ? '<0.000001'
          : `~${farmWayaPerSecondNum.toFixed(6)}`
        return farmWayaPerSecond
      },
      [regularWayaPerBlock],
    ),
    getNumberFarmWayaPerSecond: useCallback(
      (poolWeight?: BigNumber) => {
        const farmWayaPerSecondNum =
          poolWeight && regularWayaPerBlock ? poolWeight.times(regularWayaPerBlock).dividedBy(BSC_BLOCK_TIME) : BIG_ZERO
        return farmWayaPerSecondNum.toNumber()
      },
      [regularWayaPerBlock],
    ),
  }
}
