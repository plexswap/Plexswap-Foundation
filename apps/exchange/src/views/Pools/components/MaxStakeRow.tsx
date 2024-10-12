import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { Flex, Text } from '@plexswap/ui-plex'
import React from 'react'

import { useTranslation } from '@plexswap/localization'
import { Token } from '@plexswap/sdk-core'
import { getFullDisplayBalance } from '@plexswap/utils/formatBalance'
import BigNumber from 'bignumber.js'

interface MaxStakeRowProps {
  small?: boolean
  stakingLimit: BigNumber
  currentBlock: number
  stakingLimitEndTimestamp?: number
  stakingToken: Token
  hasPoolStarted: boolean
  endTimestamp?: number
}

const MaxStakeRow: React.FC<React.PropsWithChildren<MaxStakeRowProps>> = ({
  small = false,
  stakingLimit,
  stakingLimitEndTimestamp,
  stakingToken,
  hasPoolStarted,
  endTimestamp,
}) => {
  const { t } = useTranslation()

  if (typeof stakingLimitEndTimestamp === 'undefined') {
    return null
  }

  const currentTimestamp = Math.floor(Date.now() / 1000)
  const showMaxStakeLimit =
    hasPoolStarted && endTimestamp && endTimestamp >= currentTimestamp && stakingLimitEndTimestamp >= currentTimestamp
  const showMaxStakeLimitCountdown = showMaxStakeLimit && endTimestamp !== stakingLimitEndTimestamp

  if (!showMaxStakeLimit) {
    return null
  }

  return (
    <Flex flexDirection="column">
      <Flex justifyContent="space-between" alignItems="center">
        <Text small={small}>{t('Max. stake per user')}:</Text>
        <Text small={small}>{`${getFullDisplayBalance(stakingLimit, stakingToken.decimals, 0)} ${
          stakingToken.symbol
        }`}</Text>
      </Flex>
      {showMaxStakeLimitCountdown && (
        <Flex justifyContent="space-between" alignItems="center">
          <Text small={small}>{t('Max. stake limit ends in')}:</Text>

          <Pool.TimeCountdownDisplay timestamp={stakingLimitEndTimestamp} />
        </Flex>
      )}
    </Flex>
  )
}

export default MaxStakeRow
