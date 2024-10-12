import { Box, Flex, Message, MessageText, useMatchBreakpoints } from '@plexswap/ui-plex'
import Trans from 'components/Trans'
import { ReactNode, memo } from 'react'
import { VaultPosition } from 'utils/wayaPool'
import WithdrawAllButton from '../Buttons/WithdrawAllButton'
import { AfterLockedActionsPropsType } from '../types'

const msg: Record<VaultPosition, ReactNode> = {
  [VaultPosition.None]: null,
  [VaultPosition.Flexible]: null,
  [VaultPosition.Locked]: null,
  [VaultPosition.LockedEnd]: (
    <Trans>
      The lock period has ended. Convert to flexible staking or renew your position to start a new lock staking.
    </Trans>
  ),
  [VaultPosition.AfterBurning]: (
    <Trans>
      The lock period has ended. To avoid more rewards being burned, convert to flexible staking or renew your position
      to start a new lock staking.
    </Trans>
  ),
}

const AfterLockedActions: React.FC<React.PropsWithChildren<AfterLockedActionsPropsType>> = ({
  position,
  isInline,
  hideConvertToFlexibleButton,
}) => {
  const { isDesktop } = useMatchBreakpoints()
  const isDesktopView = isInline && isDesktop
  const Container = isDesktopView ? Flex : Box

  return (
    <Message
      variant="warning"
      mb="16px"
      action={
        <Container mt={!isDesktopView ? '8px' : undefined} ml="10px">
          {/* <ExtendButton
            modalTitle={t('Renew')}
            lockEndTime="0"
            lockStartTime="0"
            stakingToken={stakingToken}
            stakingTokenPrice={stakingTokenPrice}
            currentLockedAmount={currentLockedAmount}
            minWidth="186px"
            variant="primary"
            mr={isDesktopView && '14px'}
            mb={!isDesktopView && '8px'}
            isRenew
            customLockWeekInSeconds={customLockWeekInSeconds}
          >
            {t('Renew')}
          </ExtendButton> */}
          {!hideConvertToFlexibleButton && <WithdrawAllButton minWidth={isDesktopView ? '200px' : undefined} />}
        </Container>
      }
      actionInline={isDesktopView}
    >
      <MessageText>{msg[position]}</MessageText>
    </Message>
  )
}

export default memo(AfterLockedActions)
