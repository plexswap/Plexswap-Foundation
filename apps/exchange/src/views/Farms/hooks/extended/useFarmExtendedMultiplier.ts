import { useCallback, useMemo } from 'react'
import { useFarmsExtendedPublic } from 'state/farmsExtended/hooks'

export function useFarmExtendedMultiplier() {
  const { data: farmExtended } = useFarmsExtendedPublic()
  const { totalAllocPoint, wayaPerSecond } = farmExtended
  const totalMultipliers = useMemo(
    () => (Number.isFinite(+totalAllocPoint) ? (+totalAllocPoint / 10).toString() : '-'),
    [totalAllocPoint],
  )

  return {
    totalMultipliers,
    getFarmWayaPerSecond: useCallback(
      (poolWeight?: string) => {
        const farmWayaPerSecondNum = poolWeight && wayaPerSecond ? Number(poolWeight) * Number(wayaPerSecond) : 0
        return farmWayaPerSecondNum === 0
          ? '0'
          : farmWayaPerSecondNum < 0.000001
          ? '<0.000001'
          : `~${farmWayaPerSecondNum.toFixed(6)}`
      },
      [wayaPerSecond],
    ),
  }
}
