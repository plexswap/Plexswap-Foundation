import { useTranslation } from '@plexswap/localization'
import { Box, Card, ExpandableSectionButton, Flex, Text, TooltipText, useModalCore, useTooltip } from '@plexswap/ui-plex'
import { FarmWidget } from '@plexswap/widgets-internal'
import BigNumber from 'bignumber.js'
import { CHAIN_QUERY_NAME } from 'config/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import { multiChainPaths } from 'state/info/constant'
import { styled } from 'styled-components'
import { getBlockExploreLink } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { AddLiquidityExtendedModal } from 'views/AddLiquidityExtended/Modal'
import { ExtendedFarm } from 'views/Farms/FarmsExtended'
import { useFarmExtendedMultiplier } from 'views/Farms/hooks/extended/useFarmExtendedMultiplier'
import { StatusView } from '../../YieldBooster/components/Extended/StatusView'
import { BoostStatus, useBoostStatus } from '../../YieldBooster/hooks/Extended/useBoostStatus'
import { useIsSomePositionBoosted } from '../../YieldBooster/hooks/Extended/useIsSomePositionBoosted'
import { useUserBoostedPoolsTokenId } from '../../YieldBooster/hooks/Extended/useWayaExtendedInfo'
import CardHeading from '../CardHeading'
import CardActionsContainer from './CardActionsContainer'
import { FarmExtendedApyButton } from './FarmExtendedApyButton'

const { DetailsSection } = FarmWidget.FarmCard

const StyledCard = styled(Card)`
  align-self: baseline;
  max-width: 100%;
  margin: 0 0 24px 0;
  ${({ theme }) => theme.mediaQueries.sm} {
    max-width: 350px;
    margin: 0 12px 46px;
  }
`

const FarmCardInnerContainer = styled(Flex)`
  flex-direction: column;
  justify-content: space-around;
  padding: 24px;
`

const ExpandingWrapper = styled.div`
  padding: 24px;
  border-top: 2px solid ${({ theme }) => theme.colors.cardBorder};
  overflow: hidden;
`

interface FarmCardProps {
  farm: ExtendedFarm
  removed: boolean
  wayaPrice?: BigNumber
  account?: string
}

export const FarmExtendedCard: React.FC<React.PropsWithChildren<FarmCardProps>> = ({ farm, removed, account }) => {
  const { t } = useTranslation()
  const { chainId } = useActiveChainId()
  const [showExpandableSection, setShowExpandableSection] = useState(false)

  const { totalMultipliers, getFarmWayaPerSecond } = useFarmExtendedMultiplier()

  const farmWayaPerSecond = getFarmWayaPerSecond(farm.poolWeight)

  const lpLabel = farm.lpSymbol && farm.lpSymbol.replace(/plexswap/gi, '')
  const earnLabel = t('WAYA + Fees')
  const { lpAddress } = farm
  const isPromotedFarm = farm.token.symbol === 'WAYA'
  const { status: boostStatus } = useBoostStatus(farm.pid)

  const infoUrl = useMemo(() => {
    return chainId ? `/info/extended${multiChainPaths[chainId]}/pairs/${lpAddress}?chain=${CHAIN_QUERY_NAME[chainId]}` : ''
  }, [chainId, lpAddress])

  const toggleExpandableSection = useCallback(() => {
    setShowExpandableSection((prev) => !prev)
  }, [])
  const aprTooltip = useTooltip(
    <>
      <Text>
        {t(
          'Global APR calculated using the total amount of active & staked liquidity with the pool WAYA reward emissions.',
        )}
      </Text>
      <br />
      <Text>{t('APRs for individual positions may vary depend on their price range settings.')}</Text>
    </>,
  )
  const { tokenIds } = useUserBoostedPoolsTokenId()
  const { isBoosted } = useIsSomePositionBoosted(farm.stakedPositions, tokenIds)
  const router = useRouter()
  const isHistory = useMemo(() => router.pathname.includes('history'), [router])
  const addLiquidityModal = useModalCore()

  return (
    <StyledCard isActive={isPromotedFarm}>
      <FarmCardInnerContainer>
        <CardHeading
          lpLabel={lpLabel}
          multiplier={farm.multiplier}
          token={farm.token}
          quoteToken={farm.quoteToken}
          version={11}
          feeAmount={farm.feeAmount}
          farmWayaPerSecond={farmWayaPerSecond}
          totalMultipliers={totalMultipliers}
          boosted={boostStatus !== BoostStatus.CanNotBoost}
          isBoosted={isBoosted}
          lpAddress={lpAddress}
          isBooster={isBoosted}
        />
        {!removed && (
          <Flex justifyContent="space-between" alignItems="center">
            <TooltipText ref={aprTooltip.targetRef}>{t('APR')}:</TooltipText>
            {aprTooltip.tooltipVisible && aprTooltip.tooltip}
            <Text style={{ display: 'flex', alignItems: 'center' }}>
              <FarmExtendedApyButton farm={farm} />
            </Text>
          </Flex>
        )}
        <Flex justifyContent="space-between">
          <Text>{t('Earn')}:</Text>
          <Text>{earnLabel}</Text>
        </Flex>
        {!account && farm.boosted && !isHistory && (
          <Box mt="24px" mb="16px">
            <StatusView status={boostStatus} />
          </Box>
        )}
        <CardActionsContainer farm={farm} lpLabel={lpLabel} account={account} />
      </FarmCardInnerContainer>
      <ExpandingWrapper>
        <ExpandableSectionButton onClick={toggleExpandableSection} expanded={showExpandableSection} />
        {showExpandableSection && (
          <>
            <AddLiquidityExtendedModal
              {...addLiquidityModal}
              currency0={unwrappedToken(farm.token)}
              currency1={unwrappedToken(farm.quoteToken)}
              feeAmount={farm.feeAmount}
            />
            <DetailsSection
              removed={removed}
              scanAddress={{ link: getBlockExploreLink(lpAddress, 'address', chainId), chainId }}
              infoAddress={infoUrl}
              totalValueFormatted={`$${parseInt(farm.activeTvlUSD ?? '0').toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}`}
              totalValueLabel={t('Staked Liquidity')}
              lpLabel={lpLabel}
              onAddLiquidity={addLiquidityModal.onOpen}
              multiplier={farm.multiplier}
              farmWayaPerSecond={farmWayaPerSecond}
              totalMultipliers={totalMultipliers}
            />
          </>
        )}
      </ExpandingWrapper>
    </StyledCard>
  )
}
