import { memo } from 'react'
import { PoolWidget as Pool } from "@plexswap/widgets-internal"
import { Token } from '@plexswap/sdk-core'
import { LightGreyCard } from 'components/Card'
import LockDurationRow from './Common/LockDurationRow'
import LockedStaking from './LockedStaking'
import useUserDataInVaultPresenter from './hooks/useUserDataInVaultPresenter'
import { LockedStakingApyPropsType } from './types'

interface LockedStakingApyProps extends LockedStakingApyPropsType {
  showIWaya?: boolean
  pool?: Pool.DeserializedPool<Token>
  account?: string
}

const LockedStakingApy: React.FC<React.PropsWithChildren<LockedStakingApyProps>> = ({ userData, pool }) => {

  const { weekDuration } = useUserDataInVaultPresenter({
    lockStartTime: userData?.lockStartTime ?? '',
    lockEndTime: userData?.lockEndTime ?? '',
    burnStartTime: userData?.burnStartTime,
  })

  return (
    <LightGreyCard>
      <LockedStaking pool={pool} userData={userData} />
      <LockDurationRow weekDuration={weekDuration} />
    </LightGreyCard>
  )
}

export default memo(LockedStakingApy)
