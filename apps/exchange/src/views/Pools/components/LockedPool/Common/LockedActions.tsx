import { useTranslation } from '@plexswap/localization'
import { Box, ButtonProps, Flex } from '@plexswap/ui-plex'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { getBalanceNumber } from '@plexswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { VaultPosition, getVaultPosition } from 'utils/wayaPool'
import AddWayaButton from '../Buttons/AddWayaButton'
import ExtendButton from '../Buttons/ExtendDurationButton'
import { LockedActionsPropsType } from '../types'
import AfterLockedActions from './AfterLockedActions'

const LockedActions: React.FC<React.PropsWithChildren<LockedActionsPropsType & ButtonProps>> = ({
  userShares,
  locked,
  lockEndTime,
  lockStartTime,
  stakingToken,
  stakingTokenBalance,
  stakingTokenPrice,
  lockedAmount,
  variant,
}) => {
  const position = useMemo(
    // () => VaultPosition.LockedEnd,
    () =>
      getVaultPosition({
        userShares,
        locked,
        lockEndTime,
      }),
    [userShares, locked, lockEndTime],
  )
  const { t } = useTranslation()
  const lockedAmountAsNumber = getBalanceNumber(lockedAmount)

  const currentBalance = useMemo(
    () => (stakingTokenBalance ? new BigNumber(stakingTokenBalance) : BIG_ZERO),
    [stakingTokenBalance],
  )

  if (position === VaultPosition.Locked) {
    return (
      <Flex>
        <Box width="100%" mr="4px">
          <AddWayaButton
            variant={variant || 'primary'}
            lockEndTime={lockEndTime ?? ''}
            lockStartTime={lockStartTime}
            currentLockedAmount={lockedAmount ?? new BigNumber(0)}
            stakingToken={stakingToken}
            currentBalance={currentBalance}
            stakingTokenBalance={stakingTokenBalance ?? new BigNumber(0)}
            stakingTokenPrice={stakingTokenPrice}
          />
        </Box>
        <Box width="100%" ml="4px">
          <ExtendButton
            variant={variant || 'primary'}
            lockEndTime={lockEndTime ?? ''}
            lockStartTime={lockStartTime}
            stakingToken={stakingToken}
            stakingTokenPrice={stakingTokenPrice}
            currentBalance={currentBalance}
            currentLockedAmount={lockedAmountAsNumber}
          >
            {t('Extend')}
          </ExtendButton>
        </Box>
      </Flex>
    )
  }

  return (
    <AfterLockedActions
      lockEndTime={lockEndTime ?? ''}
      lockStartTime={lockStartTime}
      position={position}
      currentLockedAmount={lockedAmountAsNumber}
      stakingToken={stakingToken}
      stakingTokenPrice={stakingTokenPrice}
    />
  )
}

export default LockedActions
