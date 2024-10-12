import { useTranslation } from '@plexswap/localization'
import { PoolCategory } from '@plexswap/pools'
import { Token } from '@plexswap/sdk-core'
import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { Box, Flex, Text, } from '@plexswap/ui-plex'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import BigNumber from 'bignumber.js'
import { styled } from 'styled-components'
import ApprovalAction from './ApprovalAction'
import HarvestActions from './HarvestActions'
import StakeActions from './StakeActions'

const InlineText = styled(Text)`
  display: inline;
`

interface CardActionsProps {
  pool: Pool.DeserializedPool<Token>
  stakedBalance: BigNumber
}

const CardActions: React.FC<React.PropsWithChildren<CardActionsProps>> = ({ pool, stakedBalance }) => {
  const { poolId, stakingToken, earningToken, poolCategory, userData, earningTokenPrice } = pool
  // Pools using native BNB behave differently than pools using a token
  const isBnbPool = poolCategory === PoolCategory.BINANCE
  const { t } = useTranslation()
  const stakingTokenBalance = userData?.stakingTokenBalance ? new BigNumber(userData.stakingTokenBalance) : BIG_ZERO
  const earnings = userData?.pendingReward ? new BigNumber(userData.pendingReward) : BIG_ZERO
  const isStaked = stakedBalance.gt(0)
  const isLoading = !userData

  return (
    <Flex flexDirection="column">
      <Flex flexDirection="column">
        <>
          <Box display="inline">
            <InlineText color="secondary" bold fontSize="12px">
              {`${earningToken.symbol} `}
            </InlineText>
            <InlineText color="textSubtle" textTransform="uppercase" bold fontSize="12px">
              {t('Earned')}
            </InlineText>
          </Box>
          <HarvestActions
            earnings={earnings}
            earningTokenSymbol={earningToken.symbol}
            earningTokenDecimals={earningToken.decimals}
            poolId={poolId}
            earningTokenPrice={earningTokenPrice || 0}
            isBnbPool={isBnbPool}
            isLoading={isLoading}
          />
        </>
        <Box display="inline">
          <InlineText color={isStaked ? 'secondary' : 'textSubtle'} textTransform="uppercase" bold fontSize="12px">
            {isStaked ? stakingToken.symbol : t('Stake')}{' '}
          </InlineText>
          <InlineText color={isStaked ? 'textSubtle' : 'secondary'} textTransform="uppercase" bold fontSize="12px">
            {isStaked ? t('Staked') : `${stakingToken.symbol}`}
          </InlineText>
        </Box>
	    needsApproval && !isStaked && !pool.isFinished ? (
          <ApprovalAction pool={pool} isLoading={isLoading} />
        ) : (
          <StakeActions
            isLoading={isLoading}
            pool={pool}
            stakingTokenBalance={stakingTokenBalance}
            stakedBalance={stakedBalance}
            isBnbPool={isBnbPool}
            isStaked={isStaked}
          />
        )
      </Flex>
    </Flex>
  )
}

export default CardActions
