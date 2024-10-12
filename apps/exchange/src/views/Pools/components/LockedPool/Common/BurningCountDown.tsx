import { useInterval } from '@plexswap/hooks'
import { memo, useCallback, useMemo, useState } from 'react'

import { UNLOCK_FREE_DURATION } from '@plexswap/pools'
import getTimePeriods from '@plexswap/utils/getTimePeriods'
import dayjs from 'dayjs'
import { convertTimeToMilliseconds } from 'utils/timeHelper'

interface PropsType {
  lockEndTime: string
}

const BurningCountDown: React.FC<React.PropsWithChildren<PropsType>> = ({ lockEndTime }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  // 1 week after lockEndTime
  const burnDate = useMemo(
    () => dayjs(convertTimeToMilliseconds(lockEndTime)).add(UNLOCK_FREE_DURATION, 'seconds'),
    [lockEndTime],
  )

  const updateRemainingSeconds = useCallback(() => {
    setRemainingSeconds(burnDate.diff(dayjs(), 'seconds'))
  }, [burnDate])

  // Update every minute
  useInterval(updateRemainingSeconds, 1000 * 60)

  const { days, hours, minutes } = getTimePeriods(remainingSeconds)

  return <>{`${days}d: ${hours}h: ${minutes}m`}</>
}

export default memo(BurningCountDown)
