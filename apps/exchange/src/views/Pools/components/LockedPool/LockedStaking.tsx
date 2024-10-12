import { useTranslation } from '@plexswap/localization'
import { DeserializedLockedVaultUser } from '@plexswap/pools'
import { Token } from '@plexswap/sdk-core'
import { BalanceWithLoading, Box, ButtonVariant, Flex, HelpIcon, Text, useTooltip } from '@plexswap/ui-plex'
import { PoolWidget as Pool } from "@plexswap/widgets-internal"
import { getBalanceNumber } from '@plexswap/utils/formatBalance'
import { BigNumber } from 'bignumber.js'
import { useMemo } from 'react'
import { styled } from 'styled-components'
import { VaultPosition, getVaultPosition } from 'utils/wayaPool'
import OriginalLockedInfo from '../OriginalLockedInfo'
import LockedActions from './Common/LockedActions'
import useUserDataInVaultPresenter from './hooks/useUserDataInVaultPresenter'

const HelpIconWrapper = styled.div`
  align-self: center;
`

interface LockedStakingProps {
  buttonVariant?: ButtonVariant
  pool?: Pool.DeserializedPool<Token>
  userData?: DeserializedLockedVaultUser
}

const LockedStaking: React.FC<React.PropsWithChildren<LockedStakingProps>> = ({ buttonVariant, pool, userData }) => {
  const { t } = useTranslation()

  const position = useMemo(
    // () => VaultPosition.LockedEnd,
    () =>
      getVaultPosition({
        userShares: userData?.userShares,
        locked: userData?.locked,
        lockEndTime: userData?.lockEndTime,
      }),
    [userData],
  )

  const stakingToken = pool?.stakingToken
  const stakingTokenPrice = pool?.stakingTokenPrice
  const stakingTokenBalance = pool?.userData?.stakingTokenBalance

  const currentLockedAmountAsBigNumber = useMemo(() => {
    return userData?.balance?.wayaAsBigNumber
  }, [userData?.balance?.wayaAsBigNumber])

  const currentLockedAmount = getBalanceNumber(currentLockedAmountAsBigNumber)

  const usdValueStaked = useMemo(
    () =>
      stakingToken && stakingTokenPrice
        ? getBalanceNumber(userData?.balance?.wayaAsBigNumber.multipliedBy(stakingTokenPrice), stakingToken?.decimals)
        : null,
    [userData?.balance?.wayaAsBigNumber, stakingTokenPrice, stakingToken],
  )

  const { lockEndDate, remainingTime, burnStartTime } = useUserDataInVaultPresenter({
    lockStartTime: userData?.lockStartTime ?? '',
    lockEndTime: userData?.lockEndTime ?? '',
    burnStartTime: userData?.burnStartTime,
  })

  const {
    targetRef: tagTargetRefOfLocked,
    tooltip: tagTooltipOfLocked,
    tooltipVisible: tagTooltipVisibleOfLocked,
  } = useTooltip(<OriginalLockedInfo pool={pool} />, {
    placement: 'bottom',
  })

  const tooltipContentOfBurn = t(
    'After Burning starts at %burnStartTime%. You need to renew your fix-term position, to initiate a new lock or convert your staking position to flexible before it starts. Otherwise all the rewards will be burned within the next 90 days.',
    { burnStartTime },
  )
  const {
    targetRef: tagTargetRefOfBurn,
    tooltip: tagTooltipOfBurn,
    tooltipVisible: tagTooltipVisibleOfBurn,
  } = useTooltip(tooltipContentOfBurn, {
    placement: 'bottom',
  })

  return (
    <Box>
      <Flex justifyContent="space-between" mb="16px">
        <Box>
          <Text color="textSubtle" textTransform="uppercase" bold fontSize="12px">
            {t('WAYA locked')}
          </Text>
          <Flex>
            <BalanceWithLoading color="text" bold fontSize="16px" value={currentLockedAmount} decimals={5} />
            {tagTooltipVisibleOfLocked && tagTooltipOfLocked}
            <HelpIconWrapper ref={tagTargetRefOfLocked}>
              <HelpIcon ml="4px" mt="2px" width="20px" height="20px" color="textSubtle" />
            </HelpIconWrapper>
          </Flex>
          <BalanceWithLoading
            value={usdValueStaked ?? 0}
            fontSize="12px"
            color="textSubtle"
            decimals={2}
            prefix="~"
            unit=" USD"
          />
        </Box>
        <Box>
          <Text color="textSubtle" textTransform="uppercase" bold fontSize="12px">
            {t('Unlocks In')}
          </Text>
          <Flex>
            <Text color={position >= VaultPosition.LockedEnd ? '#D67E0A' : 'text'} bold fontSize="16px">
              {position >= VaultPosition.LockedEnd ? t('Unlocked') : remainingTime}
            </Text>
            {tagTooltipVisibleOfBurn && tagTooltipOfBurn}
            <span ref={tagTargetRefOfBurn}>
              <HelpIcon ml="4px" mt="2px" width="20px" height="20px" color="textSubtle" />
            </span>
          </Flex>
          <Text color={position >= VaultPosition.LockedEnd ? '#D67E0A' : 'text'} fontSize="12px">
            {t('On %date%', { date: lockEndDate })}
          </Text>
        </Box>
      </Flex>
      <Box mb="16px">
         <LockedActions
            userShares={userData?.userShares}
            locked={userData?.locked}
            lockEndTime={userData?.lockEndTime}
            lockStartTime={userData?.lockStartTime ?? ''}
            stakingToken={stakingToken}
            stakingTokenBalance={stakingTokenBalance ?? new BigNumber(0)}
            stakingTokenPrice={pool?.stakingTokenPrice ?? 0}
            lockedAmount={currentLockedAmountAsBigNumber ?? new BigNumber(0)}
            variant={buttonVariant}
          />
          </Box>
    </Box>
  )
}

export default LockedStaking
