import { useTranslation } from '@plexswap/localization'
import { Box, Button, Flex } from '@plexswap/ui-plex'
import useTheme from 'hooks/useTheme'
import { useCallback, useMemo } from 'react'
import { useBoostStatus } from '../../hooks/Extended/useBoostStatus'
import { useUpdateLiquidity } from '../../hooks/Extended/useUpdateLiquidity'
import {
    useUserBoostedPoolsTokenId,
    useUserPositionInfo,
    useVoterUserMultiplierBeforeBoosted,
    useWayaBoostLimitAndLockInfo,
} from '../../hooks/Extended/useWayaExtendedInfo'

import { StatusView } from './StatusView'
import { StatusViewButtons } from './StatusViewButtons'

const SHOULD_UPDATE_THRESHOLD = 1.1

export const WayaExtendedCardView: React.FC<{
  tokenId: string
  pid: number
  isFarmStaking?: boolean
}> = ({ tokenId, pid, isFarmStaking }) => {
  const { t } = useTranslation()
  const { status: boostStatus, updateStatus } = useBoostStatus(pid, tokenId)
  const { updateBoostedPoolsTokenId } = useUserBoostedPoolsTokenId()
  const {
    data: { boostMultiplier },
    updateUserPositionInfo,
  } = useUserPositionInfo(tokenId)

  const onDone = useCallback(() => {
    updateStatus()
    updateUserPositionInfo()
    updateBoostedPoolsTokenId()
  }, [updateStatus, updateUserPositionInfo, updateBoostedPoolsTokenId])
  const { locked, isLockEnd } = useWayaBoostLimitAndLockInfo()

  const { updateLiquidity, isConfirming } = useUpdateLiquidity(tokenId, onDone)
  const { voterUserMultiplierBeforeBoosted } = useVoterUserMultiplierBeforeBoosted(tokenId)
  const { theme } = useTheme()
  const lockValidated = useMemo(() => {
    return locked && !isLockEnd
  }, [locked, isLockEnd])
  const shouldUpdate = useMemo(() => {
    if (
      boostMultiplier &&
      voterUserMultiplierBeforeBoosted &&
      locked &&
      boostMultiplier * SHOULD_UPDATE_THRESHOLD <= voterUserMultiplierBeforeBoosted
    )
      return true
    return false
  }, [boostMultiplier, voterUserMultiplierBeforeBoosted, locked])

  return (
    <Flex width="100%" alignItems="center" justifyContent="space-between">
      <StatusView
        status={boostStatus}
        boostedMultiplier={boostMultiplier}
        expectMultiplier={voterUserMultiplierBeforeBoosted}
        isFarmStaking={isFarmStaking}
        shouldUpdate={shouldUpdate}
      />
      <Box>
        <StatusViewButtons
          locked={lockValidated}
          updateButton={
            shouldUpdate && lockValidated ? (
              <Button
                onClick={() => {
                  updateLiquidity()
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: `2px solid ${theme.colors.primary}`,
                  color: theme.colors.primary,
                  padding: isConfirming ? '0 10px' : undefined,
                }}
                isLoading={isConfirming}
              >
                {isConfirming ? t('Confirming') : t('Update')}
              </Button>
            ) : null
          }
        />
      </Box>
    </Flex>
  )
}
