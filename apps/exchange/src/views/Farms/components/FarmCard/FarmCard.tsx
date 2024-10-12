import { ChainId } from '@plexswap/chains'
import { FarmWithStakedValue } from '@plexswap/farms'
import { useTranslation } from '@plexswap/localization'
import { Card, ExpandableSectionButton, Flex, Skeleton, Text, useModalCore } from '@plexswap/ui-plex'
import { FarmWidget } from '@plexswap/widgets-internal'
import BigNumber from 'bignumber.js'
import { BASE_ADD_LIQUIDITY_URL } from 'config'
import { CHAIN_QUERY_NAME } from 'config/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useCallback, useMemo, useState } from 'react'
import { multiChainPaths } from 'state/info/constant'
import { styled } from 'styled-components'
import { getBlockExploreLink } from 'utils'
import getLiquidityUrlPathParts from 'utils/getLiquidityUrlPathParts'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { AddLiquidityExtendedModal } from 'views/AddLiquidityExtended/Modal'
import { SELECTOR_TYPE } from 'views/AddLiquidityExtended/types'
import { useWayaBoostLimitAndLockInfo } from 'views/Farms/components/YieldBooster/hooks/Extended/useWayaExtendedInfo'
import { useFarmCoreMultiplier } from 'views/Farms/hooks/useFarmCoreMultiplier'
import { RewardPerDay } from 'views/PositionManagers/components/RewardPerDay'
import ApyButton from './ApyButton'
import CardActionsContainer from './CardActionsContainer'
import CardHeading from './CardHeading'

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
  farm: FarmWithStakedValue
  displayApr: string | null
  removed: boolean
  wayaPrice?: BigNumber
  account?: string
  originalLiquidity?: BigNumber
}

const FarmCard: React.FC<React.PropsWithChildren<FarmCardProps>> = ({
  farm,
  displayApr,
  removed,
  wayaPrice,
  account,
  originalLiquidity,
}) => {
  const { t } = useTranslation()
  const { chainId } = useActiveChainId()
  const [showExpandableSection, setShowExpandableSection] = useState(false)

  const { totalMultipliers, getFarmWayaPerSecond, getNumberFarmWayaPerSecond } = useFarmCoreMultiplier()
  const isBooster = Boolean(farm.wayaWrapperAddress)
  const farmWayaPerSecond = getFarmWayaPerSecond(farm.poolWeight)
  const numberFarmWayaPerSecond = isBooster
    ? farm?.wayaPublicData?.rewardPerSecond ?? 0
    : getNumberFarmWayaPerSecond(farm.poolWeight)

  const { locked } = useWayaBoostLimitAndLockInfo()

  const liquidity =
    farm?.liquidity && originalLiquidity?.gt(0) ? farm.liquidity.plus(originalLiquidity) : farm.liquidity

  const totalValueFormatted =
    liquidity && liquidity.gt(0)
      ? `$${liquidity.toNumber().toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : ''

  const lpLabel = farm.lpSymbol && farm.lpSymbol.replace(/plexswap/gi, '')
  const earnLabel = t('WAYA + Fees')

  const liquidityUrlPathParts = getLiquidityUrlPathParts({
    quoteTokenAddress: farm.quoteToken.address,
    tokenAddress: farm.token.address,
    chainId: farm.token.chainId,
  })

  const addLiquidityUrl = `${BASE_ADD_LIQUIDITY_URL}/core/${liquidityUrlPathParts}`
  const { lpAddress, stableSwapAddress, stableLpFee } = farm
  const isPromotedFarm = farm.token.symbol === 'WAYA'

  const infoUrl = useMemo(() => {
    if (farm.isStable) {
      return `/info${multiChainPaths[farm.token.chainId]}/pairs/${stableSwapAddress}?type=stableSwap&chain=${
        CHAIN_QUERY_NAME[farm.token.chainId]
      }`
    }
    return `/info${multiChainPaths[farm.token.chainId]}/pairs/${lpAddress}?chain=${
      CHAIN_QUERY_NAME[farm.token.chainId]
    }`
  }, [farm, lpAddress, stableSwapAddress])

  const toggleExpandableSection = useCallback(() => {
    setShowExpandableSection((prev) => !prev)
  }, [])

  const addLiquidityModal = useModalCore()

  return (
    <StyledCard isActive={isPromotedFarm}>
      <FarmCardInnerContainer>
        <CardHeading
          lpLabel={lpLabel}
          multiplier={farm.multiplier}
          token={farm.token}
          quoteToken={farm.quoteToken}
          boosted={false}
          isStable={farm.isStable}
          version= {1}
          pid={farm.pid}
          farmWayaPerSecond={farmWayaPerSecond}
          totalMultipliers={totalMultipliers}
          isBooster={isBooster && farm?.wayaPublicData?.isRewardInRange}
          wayaWrapperAddress={farm.wayaWrapperAddress}
        />
        {!removed && (
          <Flex justifyContent="space-between" alignItems="center">
            <Text>{t('APR')}:</Text>
            <Text style={{ display: 'flex', alignItems: 'center' }}>
              {farm.apr ? (
                <>
                  {}
                  <ApyButton
                    variant="text-and-button"
                    pid={farm.pid}
                    lpTokenPrice={farm.lpTokenPrice}
                    lpSymbol={farm.lpSymbol}
                    multiplier={farm.multiplier}
                    lpLabel={lpLabel}
                    addLiquidityUrl={addLiquidityUrl}
                    wayaPrice={wayaPrice}
                    apr={
                      (isBooster && farm.wayaPublicData?.rewardPerSecond === 0) ||
                      !farm?.wayaPublicData?.isRewardInRange
                        ? 0
                        : farm.apr
                    }
                    displayApr={displayApr ?? undefined}
                    lpRewardsApr={farm.lpRewardsApr}
                    isBooster={isBooster && farm?.wayaPublicData?.isRewardInRange && chainId === ChainId.BSC}
                    useTooltipText
                    stableSwapAddress={stableSwapAddress}
                    stableLpFee={stableLpFee}
                    farmWayaPerSecond={farmWayaPerSecond}
                    totalMultipliers={totalMultipliers}
                    boosterMultiplier={
                      isBooster
                        ? farm?.wayaUserData?.boosterMultiplier === 0 ||
                          farm?.wayaUserData?.stakedBalance.eq(0) ||
                          !locked
                          ? 2.5
                          : farm?.wayaUserData?.boosterMultiplier
                        : 1
                    }
                  />
                </>
              ) : (
                <Skeleton height={24} width={80} />
              )}
            </Text>
          </Flex>
        )}
        <Flex justifyContent="space-between">
          <Text>{t('Earn')}:</Text>
          <Text>{earnLabel}</Text>
        </Flex>
        <Flex justifyContent="space-between">
          <Text>{t('Reward/Day')}:</Text>
          <RewardPerDay rewardPerSec={Number(numberFarmWayaPerSecond)} />
        </Flex>
        <CardActionsContainer
          farm={farm}
          lpLabel={lpLabel}
          account={account}
          addLiquidityUrl={addLiquidityUrl}
          displayApr={displayApr}
          boosterMultiplier={isBooster ? farm.wayaUserData?.boosterMultiplier ?? 1 : 1}
        />
      </FarmCardInnerContainer>

      <ExpandingWrapper>
        <ExpandableSectionButton onClick={toggleExpandableSection} expanded={showExpandableSection} />
        {showExpandableSection && (
          <>
            <AddLiquidityExtendedModal
              {...addLiquidityModal}
              currency0={unwrappedToken(farm.token)}
              currency1={unwrappedToken(farm.quoteToken)}
              preferredSelectType={farm.isStable ? SELECTOR_TYPE.STABLE : SELECTOR_TYPE.CORE}
            />
            <DetailsSection
              removed={removed}
              scanAddress={{ link: getBlockExploreLink(lpAddress, 'address', chainId), chainId }}
              infoAddress={infoUrl}
              totalValueFormatted={totalValueFormatted}
              lpLabel={lpLabel}
              onAddLiquidity={addLiquidityModal.onOpen}
              multiplier={farm.multiplier}
              farmWayaPerSecond={farmWayaPerSecond}
              totalMultipliers={totalMultipliers}
              isCoreWayaWrapperFarm={isBooster}
            />
          </>
        )}
      </ExpandingWrapper>
    </StyledCard>
  )
}

export default FarmCard
