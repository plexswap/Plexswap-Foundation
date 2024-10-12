/* eslint-disable no-case-declarations */
import { useDelayedUnmount } from '@plexswap/hooks'
import { useTranslation } from '@plexswap/localization'
import { Flex, useMatchBreakpoints } from '@plexswap/ui-plex'
import { FarmWidget } from '@plexswap/widgets-internal'
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { styled } from 'styled-components'

import { ChainId } from '@plexswap/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { CoreFarm, ExtendedFarm } from 'views/Farms/FarmsExtended'
import { useWayaBoostLimitAndLockInfo } from 'views/Farms/components/YieldBooster/hooks/Extended/useWayaExtendedInfo'
import { RewardPerDay } from 'views/PositionManagers/components/RewardPerDay'
import { FarmExtendedApyButton } from '../FarmCard/Extended/FarmExtendedApyButton'
import { useIsSomePositionBoosted } from '../YieldBooster/hooks/Extended/useIsSomePositionBoosted'
import { useUserBoostedPoolsTokenId } from '../YieldBooster/hooks/Extended/useWayaExtendedInfo'
import { ActionPanelExtended, ActionPanelCore } from './Actions/ActionPanel'
import Apr, { AprProps } from './Apr'
import { FarmCell } from './Farm'

const { BoostedTag, StableFarmTag, CoreTag, ExtendedFeeTag } = FarmWidget.Tags
const { CellLayout, Details, Multiplier, Liquidity, Earned, LpAmount, StakedLiquidity } = FarmWidget.FarmTable
const { DesktopColumnSchema, MobileColumnSchema, ExtendedDesktopColumnSchema } = FarmWidget

export type RowProps = {
  earned: FarmWidget.FarmTableEarnedProps
  initialActivity?: boolean
  multiplier: FarmWidget.FarmTableMultiplierProps
} & (CoreRowProps | ExtendedRowProps)

export type CoreRowProps = {
  type: 'core'
  farm: FarmWidget.FarmTableFarmTokenInfoProps & { version: 1 }
  liquidity: FarmWidget.FarmTableLiquidityProps
  apr: AprProps
  details: CoreFarm
  rewardPerDay: Record<string, any>
}

export type ExtendedRowProps = {
  type: 'extended'
  apr: {
    value: string
    pid: number
  }
  stakedLiquidity: FarmWidget.FarmTableLiquidityProps
  farm: FarmWidget.FarmTableFarmTokenInfoProps & { version: 11 }
  details: ExtendedFarm
  availableLp: {
    pid: number
    amount: number
  }
  stakedLp: {
    pid: number
    amount: number
  }
}

type RowPropsWithLoading = {
  userDataReady: boolean
  isLastFarm: boolean
} & RowProps

const cells = {
  apr: Apr,
  farm: FarmCell,
  earned: Earned,
  details: Details,
  multiplier: Multiplier,
  liquidity: Liquidity,
  stakedLiquidity: StakedLiquidity,
  availableLp: LpAmount,
  stakedLp: LpAmount,
}

const CellInner = styled.div`
  padding: 24px 0px;
  display: flex;
  width: 100%;
  align-items: center;
  padding-right: 8px;

  ${({ theme }) => theme.mediaQueries.xl} {
    padding-right: 12px;
  }
`

const StyledTr = styled.tr`
  cursor: pointer;
  &:not(:last-child) {
    border-bottom: 2px solid ${({ theme }) => theme.colors.disabled};
  }
`

const EarnedMobileCell = styled.td`
  padding: 16px 0 24px 16px;
`

const AprMobileCell = styled.td`
  padding-top: 16px;
  padding-bottom: 24px;
`

const FarmMobileCell = styled.td`
  padding-top: 24px;
`

const Row: React.FunctionComponent<React.PropsWithChildren<RowPropsWithLoading>> = (props) => {
  const { initialActivity, userDataReady, farm, multiplier } = props
  const hasSetInitialValue = useRef(false)
  const hasStakedAmount = farm.isStaking || false
  const [actionPanelExpanded, setActionPanelExpanded] = useState(hasStakedAmount)
  const shouldRenderChild = useDelayedUnmount(actionPanelExpanded, 300)
  const { t } = useTranslation()

  const { tokenIds } = useUserBoostedPoolsTokenId()
  const { isBoosted } = useIsSomePositionBoosted(props.type === 'extended' ? props?.details?.stakedPositions : [], tokenIds)
  const { locked } = useWayaBoostLimitAndLockInfo()
  const { chainId } = useActiveChainId()
  const toggleActionPanel = useCallback(() => {
    setActionPanelExpanded(!actionPanelExpanded)
  }, [actionPanelExpanded])

  useEffect(() => {
    setActionPanelExpanded(hasStakedAmount)
  }, [hasStakedAmount])
  useEffect(() => {
    if (initialActivity && hasSetInitialValue.current === false) {
      setActionPanelExpanded(initialActivity)
      hasSetInitialValue.current = true
    }
  }, [initialActivity])

  const { isDesktop, isMobile } = useMatchBreakpoints()

  const isSmallerScreen = !isDesktop

  const tableSchema = useMemo(() => {
    return isSmallerScreen ? MobileColumnSchema : props.type === 'extended' ? ExtendedDesktopColumnSchema : DesktopColumnSchema
  }, [isSmallerScreen, props.type])
  const columnNames = useMemo(() => tableSchema.map((column) => column.name), [tableSchema])

  return (
    <>
      {!isMobile ? (
        <StyledTr onClick={toggleActionPanel}>
          {Object.keys(props).map((key) => {
            const columnIndex = columnNames.indexOf(key)
            if (columnIndex === -1) {
              return null
            }

            switch (key) {
              case 'type':
                return (
                  <td key={key}>
                    <CellInner style={{ minWidth: '120px', gap: '4px', paddingRight: isDesktop ? 24 : undefined }}>
                      {props.type === 'core' ? (
                        props?.details?.isStable ? (
                          <StableFarmTag scale="sm" />
                        ) : (
                          <CoreTag scale="sm" />
                        )
                      ) : null}
                      {props.type === 'core' &&
                      props?.details?.wayaWrapperAddress &&
                      props?.details?.wayaPublicData?.isRewardInRange &&
                      chainId === ChainId.BSC ? (
                        <BoostedTag scale="sm" />
                      ) : null}
                      {props.type === 'extended' && <ExtendedFeeTag feeAmount={props.details.feeAmount} scale="sm" />}
                      {isBoosted ? <BoostedTag scale="sm" /> : null}
                    </CellInner>
                  </td>
                )
              case 'details':
                return (
                  <td key={key} colSpan={props.type === 'extended' ? 1 : 2}>
                    <CellInner
                      style={{
                        justifyContent: props.type !== 'extended' ? 'flex-end' : 'center',
                      }}
                    >
                      <CellLayout>
                        <Details actionPanelToggled={actionPanelExpanded} />
                      </CellLayout>
                    </CellInner>
                  </td>
                )

              case 'apr':
                if (props.type === 'extended') {
                  return (
                    <td key={key}>
                      <CellInner>
                        <CellLayout label={t('APR')}>
                          <FarmExtendedApyButton farm={props.details} />
                        </CellLayout>
                      </CellInner>
                    </td>
                  )
                }

                return (
                  <td key={key}>
                    <CellInner>
                      <CellLayout label={t('APR')}>
                        <Apr
                          {...props.apr}
                          hideButton={isSmallerScreen}
                          strikethrough={false}
                          boosted={false}
                          farmWayaPerSecond={
                            props?.details?.wayaWrapperAddress
                              ? (props?.details?.wayaPublicData?.rewardPerSecond ?? 0).toFixed(4)
                              : multiplier.farmWayaPerSecond
                          }
                          totalMultipliers={multiplier.totalMultipliers}
                          boosterMultiplier={
                            props?.details?.wayaWrapperAddress
                              ? props?.details?.wayaUserData?.boosterMultiplier === 0 ||
                                props?.details?.wayaUserData?.stakedBalance.eq(0) ||
                                !locked
                                ? 2.5
                                : props?.details?.wayaUserData?.boosterMultiplier
                              : 1
                          }
                          isBooster={
                            Boolean(props?.details?.wayaWrapperAddress) &&
                            props?.details?.wayaPublicData?.isRewardInRange &&
                            chainId === ChainId.BSC
                          }
                        />
                      </CellLayout>
                    </CellInner>
                  </td>
                )
              case 'rewardPerDay':
                if (props.type === 'core') {
                  return (
                    <td key={key}>
                      <CellInner>
                        <CellLayout label={t('Reward Per Day')}>
                          <RewardPerDay
                            rewardPerSec={
                              props?.details?.wayaWrapperAddress
                                ? props?.details?.wayaPublicData?.rewardPerSecond ?? 0
                                : props.farm.rewardWayaPerSecond ?? 0
                            }
                            scale="sm"
                            style={{ marginTop: 5 }}
                          />
                        </CellLayout>
                      </CellInner>
                    </td>
                  )
                }
                return <td key={key} />
              case 'multiplier':
                if (props.type === 'extended')
                  return (
                    <td key={key}>
                      <CellInner>
                        <CellLayout label={t(tableSchema[columnIndex].label)}>
                          <Multiplier {...props.multiplier} />
                        </CellLayout>
                      </CellInner>
                    </td>
                  )
                return <td key={key} />

              default:
                if (cells[key]) {
                  return (
                    <td key={key}>
                      <CellInner>
                        <CellLayout label={t(tableSchema[columnIndex].label)}>
                          {createElement(cells[key], {
                            ...props[key],
                            userDataReady,
                            chainId: props?.details?.token.chainId,
                            lpAddress: props?.details?.lpAddress,
                          })}
                        </CellLayout>
                      </CellInner>
                    </td>
                  )
                }
                return null
            }
          })}
        </StyledTr>
      ) : (
        <>
          <tr style={{ cursor: 'pointer' }} onClick={toggleActionPanel}>
            <FarmMobileCell colSpan={3}>
              <Flex justifyContent="space-between" alignItems="center">
                <FarmCell {...props.farm} />
                <Flex
                  mr="16px"
                  alignItems={isMobile ? 'end' : 'center'}
                  flexDirection={isMobile ? 'column' : 'row'}
                  style={{ gap: '4px' }}
                >
                  {props.type === 'core' ? (
                    props?.details?.isStable ? (
                      <StableFarmTag scale="sm" />
                    ) : (
                      <CoreTag scale="sm" />
                    )
                  ) : null}
                  {props.type === 'core' &&
                  props?.details?.wayaWrapperAddress &&
                  props?.details?.wayaPublicData?.isRewardInRange &&
                  chainId === ChainId.BSC ? (
                    <BoostedTag scale="sm" />
                  ) : null}
                  {props.type === 'extended' && <ExtendedFeeTag feeAmount={props.details.feeAmount} scale="sm" />}
                  {isBoosted ? <BoostedTag style={{ background: 'none', verticalAlign: 'bottom' }} scale="sm" /> : null}
                </Flex>
              </Flex>
            </FarmMobileCell>
          </tr>
          <StyledTr onClick={toggleActionPanel}>
            <td width="33%">
              <EarnedMobileCell>
                <CellLayout label={t('Earned')}>
                  <Earned {...props.earned} userDataReady={userDataReady} />
                </CellLayout>
              </EarnedMobileCell>
            </td>
            <td width="33%">
              <AprMobileCell>
                <CellLayout label={t('APR')}>
                  {props.type === 'extended' ? (
                    <FarmExtendedApyButton farm={props.details} />
                  ) : (
                    <>
                      <Apr
                        {...props.apr}
                        hideButton
                        strikethrough={false}
                        boosted={false}
                        farmWayaPerSecond={
                          props?.details?.wayaWrapperAddress
                            ? (props?.details?.wayaPublicData?.rewardPerSecond ?? 0).toFixed(4)
                            : multiplier.farmWayaPerSecond
                        }
                        totalMultipliers={multiplier.totalMultipliers}
                        isBooster={
                          Boolean(props?.details?.wayaWrapperAddress) &&
                          props?.details?.wayaPublicData?.isRewardInRange &&
                          chainId === ChainId.BSC
                        }
                        boosterMultiplier={
                          props?.details?.wayaWrapperAddress
                            ? props?.details?.wayaUserData?.boosterMultiplier === 0 ||
                              props?.details?.wayaUserData?.stakedBalance.eq(0) ||
                              !locked
                              ? 2.5
                              : props?.details?.wayaUserData?.boosterMultiplier
                            : 1
                        }
                      />
                    </>
                  )}
                </CellLayout>
              </AprMobileCell>
            </td>
            <td width="33%">
              <CellInner style={{ justifyContent: 'flex-end' }}>
                <Details actionPanelToggled={actionPanelExpanded} />
              </CellInner>
            </td>
          </StyledTr>
        </>
      )}
      {shouldRenderChild && (
        <tr>
          <td colSpan={9}>
            {props.type === 'extended' ? (
              <ActionPanelExtended
                {...props}
                expanded={actionPanelExpanded}
                alignLinksToRight={isMobile}
                isLastFarm={props.isLastFarm}
              />
            ) : (
              <ActionPanelCore
                {...props}
                expanded={actionPanelExpanded}
                alignLinksToRight={isMobile}
                isLastFarm={props.isLastFarm}
                userDataReady={userDataReady}
              />
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default Row
