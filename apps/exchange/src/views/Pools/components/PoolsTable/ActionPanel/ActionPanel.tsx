import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import {
    BalanceWithLoading,
    Box,
    Flex,
    HelpIcon,
    Text,
    useMatchBreakpoints
} from '@plexswap/ui-plex'

import { css, keyframes, styled } from 'styled-components'
import { useTranslation } from '@plexswap/localization'
import { Token } from '@plexswap/sdk-core'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { getBalanceNumber } from '@plexswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import { useVaultPoolByKey } from 'state/pools/hooks'
import { DeserializedLockedVaultUser, DeserializedLockedWayaVault, VaultKey } from '@plexswap/pools'
import LockDurationRow from '../../LockedPool/Common/LockDurationRow'
import YieldBoostRow from '../../LockedPool/Common/YieldBoostRow'
import useUserDataInVaultPresenter from '../../LockedPool/hooks/useUserDataInVaultPresenter'
import PoolStatsInfo from '../../PoolStatsInfo'
import PoolTypeTag from '../../PoolTypeTag'
import { VaultPositionTagWithLabel } from '../../Vault/VaultPositionTag'
import AutoHarvest from './AutoHarvest'
import Harvest from './Harvest'
import Stake from './Stake'

const expandAnimation = keyframes`
  from {
    max-height: 0px;
  }
  to {
    max-height: 1000px;
  }
`

const collapseAnimation = keyframes`
  from {
    max-height: 1000px;
  }
  to {
    max-height: 0px;
  }
`

export const StyledActionPanel = styled.div<{ expanded: boolean }>`
  animation: ${({ expanded }) =>
    expanded
      ? css`
          ${expandAnimation} 300ms linear forwards
        `
      : css`
          ${collapseAnimation} 300ms linear forwards
        `};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.dropdown};
  display: flex;
  flex-direction: column-reverse;
  justify-content: center;
  padding: 12px;

  ${({ theme }) => theme.mediaQueries.lg} {
    flex-direction: row;
    padding: 16px;
  }
`

export const ActionContainer = styled(Box)<{ isAutoVault?: boolean; hasBalance?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  flex-wrap: wrap;

  ${({ theme }) => theme.mediaQueries.sm} {
    flex-direction: row;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    flex-direction: ${({ isAutoVault }) => (isAutoVault ? 'row' : null)};
    align-items: ${({ isAutoVault, hasBalance }) => (isAutoVault ? (hasBalance ? 'flex-start' : 'stretch') : 'center')};
  }
`

interface ActionPanelProps {
  account: string
  pool: Pool.DeserializedPool<Token>
  expanded: boolean
}

export const InfoSection = styled(Box)`
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: auto;

  padding: 8px 8px;
  ${({ theme }) => theme.mediaQueries.lg} {
    padding: 0;
    flex-basis: 230px;
    margin-right: 16px;
    ${Text} {
      font-size: 14px;
    }
  }
`

const YieldBoostDurationRow = ({ lockEndTime, lockStartTime }) => {
  const { weekDuration, secondDuration } = useUserDataInVaultPresenter({
    lockEndTime,
    lockStartTime,
  })

  return (
    <>
      <YieldBoostRow secondDuration={secondDuration} />
      <LockDurationRow weekDuration={weekDuration} />
    </>
  )
}

const ActionPanel: React.FC<React.PropsWithChildren<ActionPanelProps>> = ({ account, pool, expanded }) => {
  const { t } = useTranslation()
  const { userData, vaultKey } = pool
  const { isMobile } = useMatchBreakpoints()

  const vaultData = useVaultPoolByKey(vaultKey as Pool.VaultKey) as DeserializedLockedWayaVault
  const wayaAsBigNumber = vaultData.userData?.balance?.wayaAsBigNumber ?? new BigNumber(0)
  const isLocked = vaultData.userData?.locked

  const stakingTokenBalance = userData?.stakingTokenBalance ? new BigNumber(userData.stakingTokenBalance) : BIG_ZERO
  const stakedBalance = userData?.stakedBalance ? new BigNumber(userData.stakedBalance) : BIG_ZERO

  const poolStakingTokenBalance = vaultKey
    ? wayaAsBigNumber.plus(stakingTokenBalance)
    : stakedBalance.plus(stakingTokenBalance)

  const originalLockedAmount = getBalanceNumber(vaultData.userData?.lockedAmount)

  return (
    <StyledActionPanel expanded={expanded}>
      <InfoSection>
        {isMobile && vaultKey === VaultKey.WayaVault && isLocked && (
          <Box mb="16px">
            <YieldBoostDurationRow
              lockEndTime={vaultData.userData?.lockEndTime}
              lockStartTime={vaultData.userData?.lockStartTime}
            />
            <Flex alignItems="center" justifyContent="space-between">
              <Text color="textSubtle" textTransform="uppercase" bold fontSize="12px">
                {t('Original locked amount')}
              </Text>
              <BalanceWithLoading color="text" bold fontSize="16px" value={originalLockedAmount} decimals={2} />
            </Flex>
          </Box>
        )}
        <Flex flexDirection="column" mb="8px">
          <PoolStatsInfo pool={pool} account={account} showTotalStaked={isMobile} alignLinksToRight={isMobile} />
        </Flex>
        <Flex alignItems="center">
          {vaultKey !== VaultKey.WayaVault && (
            <PoolTypeTag vaultKey={vaultKey} isLocked={isLocked} account={account}>
              {(tagTargetRef: any) => (
                <Flex ref={tagTargetRef}>
                  <HelpIcon ml="4px" width="20px" height="20px" color="textSubtle" />
                </Flex>
              )}
            </PoolTypeTag>
          )}
        </Flex>
      </InfoSection>
      <ActionContainer>
        <Box width="100%">
          {pool.vaultKey === VaultKey.WayaVault && (
            <VaultPositionTagWithLabel
              userData={vaultData.userData as DeserializedLockedVaultUser}
              width={['auto', null, 'fit-content']}
              ml={['12px', null, null, null, null, '32px']}
            />
          )}
          <ActionContainer isAutoVault={!!pool.vaultKey} hasBalance={poolStakingTokenBalance.gt(0)}>
            {pool.vaultKey ? <AutoHarvest pool={pool} /> : <Harvest {...pool} />}
            <Stake pool={pool} />
          </ActionContainer>
        </Box>
      </ActionContainer>
    </StyledActionPanel>
  )
}

export default ActionPanel
