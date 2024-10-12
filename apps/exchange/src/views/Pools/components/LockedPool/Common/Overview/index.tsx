import { Box, Flex, Message, MessageText, Text } from '@plexswap/ui-plex'
import { useMemo } from 'react'
import BN from 'bignumber.js'

import { useTranslation } from '@plexswap/localization'
import { LightGreyCard } from 'components/Card'
import dayjs from 'dayjs'
import { useVaultApy } from 'hooks/useVaultApy'
import _toNumber from 'lodash/toNumber'
import { convertTimeToMilliseconds } from 'utils/timeHelper'
import formatSecondsToWeeks from '../../../utils/formatSecondsToWeeks'
import CalculatorButton from '../../Buttons/CalculatorButton'
import { OverviewPropsType } from '../../types'
import formatIWaya from '../../utils/formatIWaya'
import formatRoi from '../../utils/formatRoi'
import BalanceRow from './BalanceRow'
import DateRow from './DateRow'
import TextRow from './TextRow'

const ZERO = new BN(0)

const Overview: React.FC<React.PropsWithChildren<OverviewPropsType>> = ({
  usdValueStaked,
  lockedAmount,
  duration,
  isValidDuration,
  newDuration,
  newLockedAmount,
  lockStartTime,
  lockEndTime,
  showLockWarning,
  ceiling,
}) => {
  const { getLockedApy, getBoostFactor } = useVaultApy()
  const { t } = useTranslation()

  const lockedApy = useMemo(() => getLockedApy(duration) || '', [getLockedApy, duration])
  const boostFactor = useMemo(() => getBoostFactor(duration), [getBoostFactor, duration])
  const newLockedApy = useMemo(() => (newDuration && getLockedApy(newDuration)) || 0, [getLockedApy, newDuration])
  const newBoost = useMemo(() => (newDuration && getBoostFactor(newDuration)) || 0, [getBoostFactor, newDuration])

  const formattedRoi = useMemo(() => {
    return formatRoi({ usdValueStaked, lockedApy, duration })
  }, [lockedApy, usdValueStaked, duration])

  const newFormattedRoi = useMemo(() => {
    return newLockedApy && formatRoi({ usdValueStaked, lockedApy: newLockedApy, duration: newDuration || 0 })
  }, [newLockedApy, usdValueStaked, newDuration])

  const now = dayjs()

  const unlockDate = newDuration
    ? (Number(lockStartTime) ? dayjs(convertTimeToMilliseconds(lockStartTime || '')) : now)
        .add(newDuration, 'seconds')
        .toDate()
    : Number(lockEndTime)
    ? new Date(convertTimeToMilliseconds(lockEndTime || ''))
    : now.add(duration, 'seconds').toDate()

  const formattediWaya = useMemo(() => {
    return formatIWaya({ lockedAmount, duration, ceiling: ceiling || ZERO }) || 0
  }, [lockedAmount, duration, ceiling])

  const newFormattediWaya = useMemo(() => {
    const amount = Number(newLockedAmount) ? newLockedAmount : lockedAmount
    const lockDuration = Number(newDuration) ? newDuration : duration

    return formatIWaya({ lockedAmount: amount, duration: lockDuration || 0, ceiling: ceiling || ZERO }) || 0
  }, [lockedAmount, newLockedAmount, duration, newDuration, ceiling])

  return (
    <>
      <Box>
        <Flex mb="4px">
          <Text fontSize="12px" color="secondary" bold mr="2px" textTransform="uppercase">
            {t('Lock')}
          </Text>
          <Text fontSize="12px" color="textSubtle" bold textTransform="uppercase">
            {t('Overview')}
          </Text>
        </Flex>
        <LightGreyCard>
          <BalanceRow title={t('Waya to be locked')} value={lockedAmount} newValue={newLockedAmount} decimals={2} />
          <BalanceRow title="iWaya" decimals={2} value={formattediWaya} newValue={newFormattediWaya} />
          <BalanceRow
            title="apr"
            unit="%"
            value={_toNumber(lockedApy)}
            decimals={2}
            newValue={_toNumber(newLockedApy)}
            tooltipContent={t(
              'Calculated based on current rates and subject to change based on pool conditions. It is an estimate provided for your convenience only, and by no means represents guaranteed returns.',
            )}
          />
          <TextRow
            title={t('duration')}
            value={isValidDuration ? formatSecondsToWeeks(duration) : ''}
            newValue={isValidDuration && newDuration ? formatSecondsToWeeks(newDuration) : ''}
          />
          <BalanceRow
            title={t('Yield boost')}
            unit="x"
            value={_toNumber(boostFactor)}
            decimals={2}
            newValue={_toNumber(newBoost)}
            tooltipContent={t(
              'Your yield will be boosted based on the total lock duration of your current fixed term staking position.',
            )}
          />
          <DateRow
            color={_toNumber(newDuration) ? 'failure' : 'text'}
            title={t('Unlock on')}
            value={isValidDuration ? unlockDate : undefined}
          />
          <BalanceRow
            title={t('Expected ROI')}
            value={formattedRoi}
            newValue={newFormattedRoi}
            prefix="$"
            decimals={2}
            suffix={<CalculatorButton />}
            tooltipContent={t(
              'Calculated based on current rates and subject to change based on pool conditions. It is an estimate provided for your convenience only, and by no means represents guaranteed returns.',
            )}
          />
        </LightGreyCard>
      </Box>
      {showLockWarning && (
        <Box mt="16px" maxWidth="370px">
          <Message variant="warning">
            <MessageText>
              {t('You will be able to withdraw the staked WAYA and profit only when the staking position is unlocked')}
            </MessageText>
          </Message>
        </Box>
      )}
    </>
  )
}

export default Overview
