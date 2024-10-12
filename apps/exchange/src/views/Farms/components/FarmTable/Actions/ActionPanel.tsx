import { useTranslation } from '@plexswap/localization'
import {
    Box,
    Button,
    Flex,
    LinkExternal,
    ScanLink,
    Skeleton,
    Text,
    useMatchBreakpoints,
    useModalCore,
} from '@plexswap/ui-plex'
import { FarmWidget } from '@plexswap/widgets-internal'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { CHAIN_QUERY_NAME } from 'config/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useTheme from 'hooks/useTheme'
import { useRouter } from 'next/router'
import { FC, useContext, useMemo } from 'react'
import { ChainLinkSupportChains, multiChainPaths } from 'state/info/constant'
import { css, keyframes, styled } from 'styled-components'
import { getBlockExploreLink } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { AddLiquidityExtendedModal } from 'views/AddLiquidityExtended/Modal'
import { SELECTOR_TYPE } from 'views/AddLiquidityExtended/types'
import { CoreFarm, ExtendedFarm } from 'views/Farms/FarmsExtended'
import { StatusView } from 'views/Farms/components/YieldBooster/components/Extended/StatusView'
import { StatusViewButtons } from 'views/Farms/components/YieldBooster/components/Extended/StatusViewButtons'
import { useBoostStatusPM } from 'views/Farms/components/YieldBooster/hooks/Extended/useBoostStatus'
import { useWayaBoostLimitAndLockInfo } from 'views/Farms/components/YieldBooster/hooks/Extended/useWayaExtendedInfo'
import { useWrapperBooster } from 'views/PositionManagers/hooks/useWrapperBooster'
import { useAccount } from 'wagmi'
import { useUpdateWayaFarms } from '../../../hooks/useUpdateWaya'
import { FarmExtendedApyButton } from '../../FarmCard/Extended/FarmExtendedApyButton'
import FarmExtendedCardList from '../../FarmCard/Extended/FarmExtendedCardList'
import { YieldBoosterStateContext } from '../../YieldBooster/components/ProxyFarmContainer'
import Apr, { AprProps } from '../Apr'
import { HarvestAction, HarvestActionContainer, ProxyHarvestActionContainer } from './HarvestAction'
import StakedAction, { ProxyStakedContainer, StakedContainer } from './StakedAction'

const { Multiplier, Liquidity, StakedLiquidity } = FarmWidget.FarmTable
const { NoPosition } = FarmWidget.FarmExtendedTable

export interface ActionPanelProps {
  apr: AprProps
  multiplier: FarmWidget.FarmTableMultiplierProps
  liquidity: FarmWidget.FarmTableLiquidityProps
  details: CoreFarm
  userDataReady: boolean
  expanded: boolean
  alignLinksToRight?: boolean
  isLastFarm: boolean
}

export interface ActionPanelExtendedProps {
  apr: {
    value: string
    pid: number
  }
  multiplier: FarmWidget.FarmTableMultiplierProps
  stakedLiquidity: FarmWidget.FarmTableLiquidityProps
  details: ExtendedFarm
  farm: FarmWidget.FarmTableFarmTokenInfoProps & { version: 11 }
  userDataReady: boolean
  expanded: boolean
  alignLinksToRight?: boolean
  isLastFarm: boolean
}

const expandAnimation = keyframes`
  from {
    max-height: 0px;
  }
  to {
    max-height: 700px;
  }
`

const collapseAnimation = keyframes`
  from {
    max-height: 700px;
  }
  to {
    max-height: 0px;
  }
`

const Container = styled.div<{ expanded; isLastFarm }>`
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
  width: 100%;
  flex-direction: column-reverse;
  padding-top: 24px;
  padding-bottom: 24px;

  ${({ theme }) => theme.mediaQueries.lg} {
    flex-direction: row;
    align-items: center;
    padding: 16px 24px;
  }
  ${({ isLastFarm }) => isLastFarm && `border-radius: 0 0 32px 32px;`}
`

const StyledLinkExternal = styled(LinkExternal)`
  font-weight: 400;
`

const StyledScanLink = styled(ScanLink)`
  font-weight: 400;
`

const ActionContainer = styled.div`
  display: flex;
  overflow: auto;
  padding-left: 24px;
  padding-right: 24px;
  flex-direction: column;

  ${({ theme }) => theme.mediaQueries.sm} {
    flex-direction: row;
    align-items: center;
    flex-grow: 1;
    flex-wrap: wrap;
  }
`

const InfoContainer = styled.div`
  min-width: 200px;
  padding-left: 24px;
  padding-right: 24px;
`

const ValueContainer = styled.div``

const ValueWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0px;
`

const StyledText = styled(Text)`
  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
`

const ActionPanelContainer = ({ expanded, values, infos, children, isLastFarm }) => {
  return (
    <Container expanded={expanded} isLastFarm={isLastFarm}>
      <InfoContainer>
        <ValueContainer>{values}</ValueContainer>
        {infos}
      </InfoContainer>
      <ActionContainer style={{ maxHeight: 700 }}>{children}</ActionContainer>
    </Container>
  )
}





export const ActionPanelExtended: FC<ActionPanelExtendedProps> = ({
  expanded,
  details,
  farm: farm_,
  multiplier,
  stakedLiquidity,
  alignLinksToRight,
  userDataReady,
  isLastFarm,
}) => {
  const { isDesktop } = useMatchBreakpoints()
  const { t } = useTranslation()
  const { chainId } = useActiveChainId()
  const { address: account } = useAccount()
  const farm = details
  const isActive = farm.multiplier !== '0X'
  const lpLabel = useMemo(() => farm.lpSymbol && farm.lpSymbol.replace(/plexswap/gi, ''), [farm.lpSymbol])
  const bsc = useMemo(
    () => getBlockExploreLink(farm.lpAddress, 'address', farm.token.chainId),
    [farm.lpAddress, farm.token.chainId],
  )

  const infoUrl = useMemo(() => {
    return `/info/extended${multiChainPaths[farm.token.chainId]}/pairs/${farm.lpAddress}?chain=${
      CHAIN_QUERY_NAME[farm.token.chainId]
    }`
  }, [farm.lpAddress, farm.token.chainId])

  const hasNoPosition = useMemo(
    () => userDataReady && farm.stakedPositions.length === 0 && farm.unstakedPositions.length === 0,
    [farm.stakedPositions.length, farm.unstakedPositions.length, userDataReady],
  )

  const addLiquidityModal = useModalCore()

  return (
    <>
      <AddLiquidityExtendedModal
        {...addLiquidityModal}
        currency0={unwrappedToken(farm.token)}
        currency1={unwrappedToken(farm.quoteToken)}
        feeAmount={farm.feeAmount}
      />
      <ActionPanelContainer
        expanded={expanded}
        isLastFarm={isLastFarm}
        values={
          <>
            {!isDesktop && (
              <>
                <ValueWrapper>
                  <Text>{t('APR')}</Text>
                  <FarmExtendedApyButton farm={farm} />
                </ValueWrapper>
                <ValueWrapper>
                  <Text>{t('Multiplier')}</Text>
                  <Multiplier {...multiplier} />
                </ValueWrapper>
                <ValueWrapper>
                  <Text>{t('Staked Liquidity')}</Text>
                  <StakedLiquidity {...stakedLiquidity} />
                </ValueWrapper>
              </>
            )}
          </>
        }
        infos={
          <>
            {isActive && (
              <Flex mb="2px" justifyContent={alignLinksToRight ? 'flex-end' : 'flex-start'}>
                <StyledText color="primary" onClick={addLiquidityModal.onOpen}>
                  {t('Add %symbol%', { symbol: lpLabel })}
                </StyledText>
              </Flex>
            )}
            <Flex mb="2px" justifyContent={alignLinksToRight ? 'flex-end' : 'flex-start'}>
              <StyledLinkExternal href={infoUrl}>{t('See Pair Info')}</StyledLinkExternal>
            </Flex>
            <Flex mb="2px" justifyContent={alignLinksToRight ? 'flex-end' : 'flex-start'}>
              <StyledScanLink
                useBscCoinFallback={typeof chainId !== 'undefined' && ChainLinkSupportChains.includes(chainId)}
                href={bsc}
              >
                {t('View Contract')}
              </StyledScanLink>
            </Flex>
          </>
        }
      >
                {!userDataReady ? (
          <Skeleton height={200} width="100%" />
        ) : account && !hasNoPosition ? (
          <FarmExtendedCardList farm={farm} direction="row" showHarvestAll />
        ) : (
          <NoPosition
            inactive={!isActive}
            boostedAction={null}
            account={account}
            hasNoPosition={hasNoPosition}
            onAddLiquidity={addLiquidityModal.onOpen}
            connectWalletButton={<ConnectWalletButton mt="8px" width="100%" />}
          />
        )}
      </ActionPanelContainer>
    </>
  )
}

export const ActionPanelCore: React.FunctionComponent<React.PropsWithChildren<ActionPanelProps>> = ({
  details,
  apr,
  multiplier,
  liquidity,
  userDataReady,
  expanded,
  isLastFarm,
  alignLinksToRight = true,
}) => {
  const wayaProps = {
    wayaWrapperAddress: details.wayaWrapperAddress,
    wayaUserData: details.wayaUserData,
    wayaPublicData: details.wayaPublicData,
  }
  const { chainId } = useActiveChainId()
  const { proxyFarm, shouldUseProxyFarm } = useContext(YieldBoosterStateContext)
  const { address: account } = useAccount()
  const { theme } = useTheme()
  const router = useRouter()
  const isHistory = useMemo(() => router.pathname.includes('history'), [router])
  const farm = details

  const { isDesktop, isMobile } = useMatchBreakpoints()
  const { locked } = useWayaBoostLimitAndLockInfo()
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation()
  const isActive = farm.multiplier !== '0X'
  const lpLabel = useMemo(() => farm.lpSymbol && farm.lpSymbol.replace(/plexswap/gi, ''), [farm.lpSymbol])
  const bsc = useMemo(
    () => getBlockExploreLink(farm.lpAddress, 'address', farm.token.chainId),
    [farm.lpAddress, farm.token.chainId],
  )

  const infoUrl = "https://docs.plexfinance.us/products/yield-farming/how-to-use-farms";

  const addLiquidityModal = useModalCore()
  const isBooster = Boolean(details?.wayaWrapperAddress)
  const isRewardInRange = details?.wayaPublicData?.isRewardInRange
  const hasStakedInWaya = Boolean(details?.wayaUserData?.stakedBalance?.gt(0))

  const { status } = useBoostStatusPM(isBooster, details?.wayaUserData?.boosterMultiplier)
  const { shouldUpdate, voterUserMultiplierBeforeBoosted } = useWrapperBooster(
    details?.wayaUserData?.boosterContractAddress ?? '0x',
    details?.wayaUserData?.boosterMultiplier ?? 1,
    details?.wayaWrapperAddress,
  )
  const { onUpdate } = useUpdateWayaFarms(details?.wayaWrapperAddress ?? '0x', details?.pid)
  return (
    <>
      <AddLiquidityExtendedModal
        {...addLiquidityModal}
        currency0={unwrappedToken(farm.token)}
        currency1={unwrappedToken(farm.quoteToken)}
        preferredSelectType={farm.isStable ? SELECTOR_TYPE.STABLE : SELECTOR_TYPE.CORE}
      />
      <ActionPanelContainer
        expanded={expanded}
        isLastFarm={isLastFarm}
        values={
          <>
            {!isDesktop && (
              <>
                <ValueWrapper>
                  <Text>{t('APR')}</Text>
                  <Apr
                    {...apr}
                    useTooltipText
                    strikethrough={false}
                    boosted={false}
                    farmWayaPerSecond={
                      details?.wayaWrapperAddress
                        ? (details?.wayaPublicData?.rewardPerSecond ?? 0).toFixed(4)
                        : multiplier.farmWayaPerSecond
                    }
                    totalMultipliers={multiplier.totalMultipliers}
                    isBooster={Boolean(details?.wayaWrapperAddress) && details?.wayaPublicData?.isRewardInRange}
                    boosterMultiplier={
                      details?.wayaWrapperAddress
                        ? details?.wayaUserData?.boosterMultiplier === 0 ||
                          details?.wayaUserData?.stakedBalance.eq(0) ||
                          !locked
                          ? 2.5
                          : details?.wayaUserData?.boosterMultiplier
                        : 1
                    }
                  />
                </ValueWrapper>
                {!details?.wayaWrapperAddress && (
                  <ValueWrapper>
                    <Text>{t('Multiplier')}</Text>
                    <Multiplier {...multiplier} />
                  </ValueWrapper>
                )}
                <ValueWrapper>
                  <Text>{t('Staked Liquidity')}</Text>
                  <Liquidity {...liquidity} />
                </ValueWrapper>
              </>
            )}
          </>
        }
        infos={
          <>
            {isActive && (
              <Flex mb="2px" justifyContent={alignLinksToRight ? 'flex-end' : 'flex-start'}>
                <StyledText color="primary" onClick={addLiquidityModal.onOpen}>
                  {t('Add %symbol%', { symbol: lpLabel })}
                </StyledText>
              </Flex>
            )}
            <Flex mb="2px" justifyContent={alignLinksToRight ? 'flex-end' : 'flex-start'}>
              <StyledLinkExternal href={infoUrl}>{t('View Tutorial')}</StyledLinkExternal>
            </Flex>
            <Flex mb="2px" justifyContent={alignLinksToRight ? 'flex-end' : 'flex-start'}>
              <StyledScanLink
                useBscCoinFallback={typeof chainId !== 'undefined' && ChainLinkSupportChains.includes(chainId)}
                href={bsc}
              >
                {t('View Contract')}
              </StyledScanLink>
            </Flex>
          </>
        }
      >
        {shouldUseProxyFarm ? (
          <ProxyHarvestActionContainer {...proxyFarm} userDataReady={userDataReady}>
            {(props) => <HarvestAction {...props} />}
          </ProxyHarvestActionContainer>
        ) : !farm?.wayaWrapperAddress ? (
          <HarvestActionContainer
            {...farm}
            {...wayaProps}
            wayaUserData={farm.wayaUserData}
            userDataReady={userDataReady}
          >
            {(harvestProps) => <HarvestAction {...harvestProps} />}
          </HarvestActionContainer>
        ) : null}
        {shouldUseProxyFarm ? (
          <ProxyStakedContainer {...proxyFarm} userDataReady={userDataReady} lpLabel={lpLabel} displayApr={apr.value}>
            {(props) => <StakedAction {...props} />}
          </ProxyStakedContainer>
        ) : (
          <>
            <StakedContainer
              {...farm}
              {...wayaProps}
              userDataReady={userDataReady}
              lpLabel={lpLabel}
              displayApr={apr.value}
            >
              {(props) => (
                <StakedAction
                  {...props}
                  wayaInfoSlot={
                    isBooster ? (
                      <>
                        {account && hasStakedInWaya && (
                          <>
                            <Box
                              style={{
                                height: isMobile ? 2 : 70,
                                width: isMobile ? '100%' : 2,
                                backgroundColor: theme.colors.cardBorder,
                              }}
                            />
                            <HarvestActionContainer {...farm} {...wayaProps} userDataReady={userDataReady}>
                              {(harvestProps) => (
                                <HarvestAction
                                  {...harvestProps}
                                  style={{
                                    border: 'none',
                                    minHeight: 'auto',
                                    marginLeft: '0px',
                                    paddingLeft: 0,
                                    paddingRight: 0,
                                    width: isMobile ? '100%' : undefined,
                                    marginBottom: isMobile ? '0' : undefined,
                                  }}
                                />
                              )}
                            </HarvestActionContainer>
                          </>
                        )}
                        {isRewardInRange && !isHistory && (
                          <Box
                            style={{
                              height: isMobile ? 2 : 70,
                              width: isMobile ? '100%' : 2,
                              backgroundColor: theme.colors.cardBorder,
                            }}
                          />
                        )}
                        {isRewardInRange && !isHistory && (
                          <Flex
                            flexGrow={1}
                            maxWidth={isMobile ? 'auto' : hasStakedInWaya ? '27%' : '50%'}
                            justifyContent="space-between"
                            alignItems="center"
                            p={isMobile ? '16px 0' : undefined}
                            width={isMobile ? '100%' : undefined}
                          >
                            <StatusView
                              status={status}
                              isFarmStaking={farm?.wayaUserData?.stakedBalance?.gt(0)}
                              boostedMultiplier={details?.wayaUserData?.boosterMultiplier}
                              maxBoostMultiplier={2.5}
                              shouldUpdate={shouldUpdate}
                              expectMultiplier={voterUserMultiplierBeforeBoosted}
                            />
                            <StatusViewButtons
                              locked={locked}
                              updateButton={
                                shouldUpdate && farm?.wayaUserData?.stakedBalance?.gt(0) ? (
                                  <Button onClick={onUpdate}>{t('Update')}</Button>
                                ) : null
                              }
                              isTableView
                            />
                          </Flex>
                        )}
                      </>
                    ) : undefined
                  }
                />
              )}
            </StakedContainer>
          </>
        )}
      </ActionPanelContainer>
    </>
  )
}
