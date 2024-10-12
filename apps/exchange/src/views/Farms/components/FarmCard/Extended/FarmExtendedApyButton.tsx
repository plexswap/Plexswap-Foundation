/* eslint-disable react/jsx-pascal-case */
import { useTranslation } from '@plexswap/localization'
import {
    AutoRow,
    CalculateIcon,
    Flex,
    IconButton,
    RocketIcon,
    Skeleton,
    Text,
    TooltipText,
    useMatchBreakpoints,
    useModalCore,
    useTooltip,
} from '@plexswap/ui-plex'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { Position, encodeSqrtRatioX96 } from '@plexswap/sdk-extended'
import { FarmWidget } from '@plexswap/widgets-internal'
import { RoiCalculatorModalCore, useRoi } from '@plexswap/widgets-internal/roi'
import BigNumber from 'bignumber.js'
import { useWayaPrice } from 'hooks/useWayaPrice'
import { useContext, useMemo, useState } from 'react'
import { styled } from 'styled-components'

import isUndefinedOrNull from '@plexswap/utils/isUndefinedOrNull'
import { Bound } from 'config/constants/types'
import { usePoolAvgInfo } from 'hooks/usePoolAvgInfo'
import useExtendedDerivedInfo from 'hooks/extended/useExtendedDerivedInfo'
import { usePairTokensPrice } from 'hooks/extended/usePairTokensPrice'
import { useAllExtendedTicks } from 'hooks/extended/usePoolTickData'
import { useFarmsExtendedPublic } from 'state/farmsExtended/hooks'
import { Field } from 'state/mint/actions'
import LiquidityFormProvider from 'views/AddLiquidityExtended/formViews/ExtendedFormView/form/LiquidityFormProvider'
import { useExtendedFormState } from 'views/AddLiquidityExtended/formViews/ExtendedFormView/form/reducer'
import { FarmsExtendedContext } from 'views/Farms'
import { ExtendedFarm } from 'views/Farms/FarmsExtended'
import { BoostStatus, useBoostStatus } from '../../YieldBooster/hooks/Extended/useBoostStatus'
import { USER_ESTIMATED_MULTIPLIER, useUserPositionInfo } from '../../YieldBooster/hooks/Extended/useWayaExtendedInfo'
import { getDisplayApr } from '../../getDisplayApr'

const ApyLabelContainer = styled(Flex)`
  cursor: pointer;
  &:hover {
    opacity: 0.5;
  }
`

type FarmExtendedApyButtonProps = {
  farm: ExtendedFarm
  existingPosition?: Position
  isPositionStaked?: boolean
  tokenId?: string
}

export function FarmExtendedApyButton(props: FarmExtendedApyButtonProps) {
  return (
    <LiquidityFormProvider>
      <FarmExtendedApyButton_ {...props} />
    </LiquidityFormProvider>
  )
}

function FarmExtendedApyButton_({ farm, existingPosition, isPositionStaked, tokenId }: FarmExtendedApyButtonProps) {
  const { farmsAvgInfo } = useContext(FarmsExtendedContext)
  const { token: baseCurrency, quoteToken: quoteCurrency, feeAmount, lpAddress } = farm
  const { t } = useTranslation()
  const roiModal = useModalCore()

  const [priceTimeWindow, setPriceTimeWindow] = useState(0)
  const prices = usePairTokensPrice(lpAddress, priceTimeWindow, baseCurrency?.chainId, roiModal.isOpen)

  const { ticks: data } = useAllExtendedTicks(baseCurrency, quoteCurrency, feeAmount, roiModal.isOpen)

  const formState = useExtendedFormState()

  const { pool, ticks, price, pricesAtTicks, currencyBalances, outOfRange } = useExtendedDerivedInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition,
    formState,
  )

  const wayaPrice = useWayaPrice()

  const sqrtRatioX96 = price && encodeSqrtRatioX96(price.numerator, price.denominator)
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const currencyAUsdPrice = +farm.tokenPriceBusd
  const currencyBUsdPrice = +farm.quoteTokenPriceBusd

  const isSorted = farm.token.sortsBefore(farm.quoteToken)

  const { status: boostedStatus } = useBoostStatus(farm.pid, tokenId)

  const poolAvgInfo = usePoolAvgInfo({
    address: farm.lpAddress,
    chainId: farm.token.chainId,
    enabled: isUndefinedOrNull(farmsAvgInfo),
  })

  const globalLpApr = !isUndefinedOrNull(farmsAvgInfo) ? farmsAvgInfo?.[farm.lpAddress?.toLowerCase()]?.apr ?? 0 : 0
  const { volumeUSD: volume24H } = !isUndefinedOrNull(farmsAvgInfo)
    ? farmsAvgInfo?.[farm.lpAddress?.toLowerCase()] || {
        volumeUSD: 0,
        tvlUSD: 0,
        feeUSD: 0,
      }
    : poolAvgInfo

  const balanceA =
    (isSorted ? existingPosition?.amount0 : existingPosition?.amount1) ?? currencyBalances[Field.CURRENCY_A]
  const balanceB =
    (isSorted ? existingPosition?.amount1 : existingPosition?.amount0) ?? currencyBalances[Field.CURRENCY_B]

  const depositUsdAsBN = useMemo(
    () =>
      balanceA &&
      balanceB &&
      currencyAUsdPrice &&
      currencyBUsdPrice &&
      new BigNumber(balanceA.toExact())
        .times(currencyAUsdPrice)
        .plus(new BigNumber(balanceB.toExact()).times(currencyBUsdPrice)),
    [balanceA, balanceB, currencyAUsdPrice, currencyBUsdPrice],
  )

  const { data: farmExtended } = useFarmsExtendedPublic()

  const wayaAprFactor = useMemo(
    () =>
      new BigNumber(farm.poolWeight)
        .times(farmExtended.wayaPerSecond)
        .times(365 * 60 * 60 * 24)
        .times(wayaPrice)
        .div(
          new BigNumber(farm.lmPoolLiquidity).plus(
            isPositionStaked ? BIG_ZERO : existingPosition?.liquidity?.toString() ?? BIG_ZERO,
          ),
        )
        .times(100),
    [
      wayaPrice,
      existingPosition?.liquidity,
      farm.lmPoolLiquidity,
      farm.poolWeight,
      farmExtended.wayaPerSecond,
      isPositionStaked,
    ],
  )

  const positionWayaApr = useMemo(
    () =>
      existingPosition
        ? outOfRange
          ? 0
          : new BigNumber(existingPosition.liquidity.toString())
              .times(wayaAprFactor)
              .div(depositUsdAsBN ?? 0)
              .toNumber()
        : 0,
    [wayaAprFactor, depositUsdAsBN, existingPosition, outOfRange],
  )

  const { apr } = useRoi({
    tickLower,
    tickUpper,
    sqrtRatioX96,
    fee: feeAmount,
    mostActiveLiquidity: pool?.liquidity,
    amountA: existingPosition?.amount0,
    amountB: existingPosition?.amount1,
    compoundOn: false,
    currencyAUsdPrice: isSorted ? currencyAUsdPrice : currencyBUsdPrice,
    currencyBUsdPrice: isSorted ? currencyBUsdPrice : currencyAUsdPrice,
    volume24H,
  })

  const lpApr = existingPosition ? +apr.toFixed(2) : globalLpApr
  const wayaApr = +(farm.wayaApr ?? 0)

  const displayApr = getDisplayApr(wayaApr, lpApr)
  const wayaAprDisplay = wayaApr.toFixed(2)
  const positionWayaAprDisplay = positionWayaApr.toFixed(2)
  const lpAprDisplay = lpApr.toFixed(2)
  const { isDesktop } = useMatchBreakpoints()
  const {
    data: { boostMultiplier },
  } = useUserPositionInfo(tokenId ?? '-1')

  const estimatedAPR = useMemo(() => {
    return (parseFloat(wayaAprDisplay) * USER_ESTIMATED_MULTIPLIER + parseFloat(lpAprDisplay)).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    })
  }, [wayaAprDisplay, lpAprDisplay])
  const canBoosted = useMemo(() => boostedStatus !== BoostStatus.CanNotBoost, [boostedStatus])
  const isBoosted = useMemo(() => boostedStatus === BoostStatus.Boosted, [boostedStatus])
  const positionDisplayApr = getDisplayApr(+positionWayaApr, lpApr)
  const positionBoostedDisplayApr = getDisplayApr(boostMultiplier * positionWayaApr, lpApr)

  const aprTooltip = useTooltip(
    <>
      <Text>
        {t('Combined APR')}: <b>{canBoosted ? estimatedAPR : displayApr}%</b>
      </Text>
      <ul>
        <li>
          {t('Farm APR')}:{' '}
          <b>
            {canBoosted && <>{parseFloat(wayaAprDisplay) * USER_ESTIMATED_MULTIPLIER}% </>}
            <Text
              display="inline-block"
              style={{ textDecoration: canBoosted ? 'line-through' : 'none', fontWeight: 800 }}
            >
              {wayaAprDisplay}%
            </Text>
          </b>
        </li>
        <li>
          {t('LP Fee APR')}: <b>{lpAprDisplay}%</b>
        </li>
      </ul>
      <br />
      <Text>
        {t('Calculated using the total active liquidity staked versus the WAYA reward emissions for the farm.')}
      </Text>
      {canBoosted && (
        <Text mt="15px">
          {t('bWAYA only boosts Farm APR. Actual boost multiplier is subject to farm and pool conditions.')}
        </Text>
      )}
      <Text mt="15px">{t('APRs for individual positions may vary depending on the configs.')}</Text>
    </>,
  )
  const existingPositionAprTooltip = useTooltip(
    <>
      <Text>
        {t('Combined APR')}: <b>{isBoosted ? positionBoostedDisplayApr : positionDisplayApr}%</b>
      </Text>
      <ul>
        <li>
          {t('Farm APR')}:{' '}
          <b>
            {isBoosted && <>{(positionWayaApr * boostMultiplier).toFixed(2)}% </>}
            <Text
              display="inline-block"
              bold={!isBoosted}
              style={{ textDecoration: isBoosted ? 'line-through' : 'none' }}
            >
              {positionWayaAprDisplay}%
            </Text>
          </b>
        </li>
        <li>
          {t('LP Fee APR')}: <b>{lpAprDisplay}%</b>
        </li>
      </ul>
    </>,
  )

  if (farm.multiplier === '0X') {
    return <Text fontSize="14px">0%</Text>
  }

  if (!displayApr) {
    return <Skeleton height={24} width={80} style={{ borderRadius: '12px' }} />
  }

  return (
    <>
      {existingPosition ? (
        <AutoRow width="auto" gap="2px">
          <ApyLabelContainer alignItems="center" style={{ textDecoration: 'initial' }} onClick={roiModal.onOpen}>
            {outOfRange ? (
              <TooltipText decorationColor="failure" color="failure" fontSize="14px">
                {positionWayaApr.toLocaleString('en-US', { maximumFractionDigits: 2 })}%
              </TooltipText>
            ) : (
              <>
                <TooltipText ref={existingPositionAprTooltip.targetRef} decorationColor="secondary">
                  <Flex style={{ gap: 3 }}>
                    {isBoosted && (
                      <>
                        {isDesktop && <RocketIcon color="success" />}
                        <Text fontSize="14px" color="success">
                          {positionBoostedDisplayApr}%
                        </Text>
                      </>
                    )}
                    <Text fontSize="14px" style={{ textDecoration: isBoosted ? 'line-through' : 'none' }}>
                      {positionDisplayApr}%
                    </Text>
                  </Flex>
                </TooltipText>
                {existingPositionAprTooltip.tooltipVisible && existingPositionAprTooltip.tooltip}
              </>
            )}
            <IconButton variant="text" style={{ height: 18, width: 18 }} scale="sm">
              <CalculateIcon width="18px" color="textSubtle" />
            </IconButton>
          </ApyLabelContainer>
        </AutoRow>
      ) : (
        <>
          <FarmWidget.FarmApyButton
            variant="text-and-button"
            handleClickButton={(e) => {
              e.stopPropagation()
              e.preventDefault()
              roiModal.onOpen()
            }}
          >
            <TooltipText ref={aprTooltip.targetRef} decorationColor="secondary">
              <Flex ml="4px" mr="5px" style={{ gap: 5 }}>
                {canBoosted && (
                  <>
                    {isDesktop && <RocketIcon color="success" />}
                    <Text bold color="success" fontSize={16}>
                      <>
                        <Text bold color="success" fontSize={14} display="inline-block" mr="3px">
                          {t('Up to')}
                        </Text>
                        {`${estimatedAPR}%`}
                      </>
                    </Text>
                  </>
                )}
                <Text style={{ textDecoration: canBoosted ? 'line-through' : 'none' }}>{displayApr}%</Text>
              </Flex>
            </TooltipText>
          </FarmWidget.FarmApyButton>
          {aprTooltip.tooltipVisible && aprTooltip.tooltip}
        </>
      )}
      {wayaPrice && wayaAprFactor && (
        <RoiCalculatorModalCore
          {...roiModal}
          isFarm
          maxLabel={existingPosition ? t('My Position') : undefined}
          closeOnOverlayClick={false}
          depositAmountInUsd={depositUsdAsBN?.toString()}
          max={depositUsdAsBN?.toString()}
          balanceA={balanceA}
          balanceB={balanceB}
          price={price}
          currencyA={baseCurrency}
          currencyB={quoteCurrency}
          currencyAUsdPrice={currencyAUsdPrice}
          currencyBUsdPrice={currencyBUsdPrice}
          sqrtRatioX96={sqrtRatioX96}
          liquidity={pool?.liquidity}
          feeAmount={feeAmount}
          ticks={data}
          volume24H={volume24H}
          priceUpper={priceUpper}
          priceLower={priceLower}
          wayaPrice={wayaPrice.toFixed(3)}
          wayaAprFactor={wayaAprFactor.times(isBoosted ? boostMultiplier : 1)}
          prices={prices}
          priceSpan={priceTimeWindow}
          onPriceSpanChange={setPriceTimeWindow}
        />
      )}
    </>
  )
}