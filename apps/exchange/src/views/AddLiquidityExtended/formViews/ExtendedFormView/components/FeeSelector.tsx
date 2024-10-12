import { ChainId } from '@plexswap/chains'
import { farmsExtendedConfigChainMap } from '@plexswap/farms/config/extended'
import { useTranslation } from '@plexswap/localization'
import { Currency } from '@plexswap/sdk-core'
import { AtomBox, AutoColumn, Button, CircleLoader, Text } from '@plexswap/ui-plex'
import tryParseAmount from '@plexswap/utils/tryParseAmount'
import { FeeAmount } from '@plexswap/sdk-extended'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { PairState, useCorePair } from 'hooks/usePairs'
import { PoolState } from 'hooks/extended/types'
import { useFeeTierDistribution } from 'hooks/extended/useFeeTierDistribution'
import { usePools } from 'hooks/extended/usePools'
import { useEffect, useMemo, useState } from 'react'
import HideShowSelectorSection from 'views/AddLiquidityExtended/components/HideShowSelectorSection'
import { HandleFeePoolSelectFn, SELECTOR_TYPE } from 'views/AddLiquidityExtended/types'
import { FeeOption } from './FeeOption'
import { FeeTierPercentageBadge } from './FeeTierPercentageBadge'
import { FEE_AMOUNT_DETAIL, SelectContainer } from './shared'

const FEE_TIERS = [FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH]

export default function FeeSelector({
  feeAmount,
  handleFeePoolSelect,
  currencyA,
  currencyB,
  handleSelectCore,
}: {
  feeAmount?: FeeAmount
  handleFeePoolSelect: HandleFeePoolSelectFn
  currencyA?: Currency | undefined
  currencyB?: Currency | undefined
  /**
   * If this is set, the selector will show a button to select the CORE pair when CORE has better token amounts
   */
  handleSelectCore?: () => void
}) {
  const { t } = useTranslation()
  const { chainId } = useActiveChainId()
  const farmExtendedConfig = farmsExtendedConfigChainMap[currencyA?.chainId as ChainId]

  const farmExtended = useMemo(() => {
    if (currencyA && currencyB) {
      const [tokenA, tokenB] = [currencyA.wrapped, currencyB.wrapped]
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
      return farmExtendedConfig?.find((f) => f.token.equals(token0) && f.quoteToken.equals(token1))
    }
    return null
  }, [currencyA, currencyB, farmExtendedConfig])

  const { isPending, isError, largestUsageFeeTier, distributions, largestUsageFeeTierTvl } = useFeeTierDistribution(
    currencyA,
    currencyB,
  )

  const [pairState, pair] = useCorePair(currencyA, currencyB)

  const [showOptions, setShowOptions] = useState(false)
  // get pool data on-chain for latest states
  const pools = usePools(
    useMemo(
      () => [
        [currencyA, currencyB, FeeAmount.LOWEST],
        [currencyA, currencyB, FeeAmount.LOW],
        [currencyA, currencyB, FeeAmount.MEDIUM],
        [currencyA, currencyB, FeeAmount.HIGH],
      ],
      [currencyA, currencyB],
    ),
  )

  const poolsByFeeTier: Record<FeeAmount, PoolState> = useMemo(
    () =>
      pools.reduce(
        (acc, [curPoolState, curPool]) => {
          return curPool
            ? {
                ...acc,
                ...{ [curPool.fee as FeeAmount]: curPoolState },
              }
            : acc
        },
        {
          // default all states to NOT_EXISTS
          [FeeAmount.LOWEST]: PoolState.NOT_EXISTS,
          [FeeAmount.LOW]: PoolState.NOT_EXISTS,
          [FeeAmount.MEDIUM]: PoolState.NOT_EXISTS,
          [FeeAmount.HIGH]: PoolState.NOT_EXISTS,
        },
      ),
    [pools],
  )

  const CorePairHasBetterTokenAmounts = useMemo(() => {
    if (!handleSelectCore) return false
    if (
      isPending ||
      isError ||
      !currencyA ||
      !currencyB ||
      [PairState.LOADING, PairState.INVALID].includes(pairState)
    ) {
      return false
    }

    // Show Add CORE button when no core pool or no extended pool
    if (
      (!isPending && !largestUsageFeeTier) ||
      pairState === PairState.NOT_EXISTS ||
      FEE_TIERS.every((tier) => poolsByFeeTier[tier] === PoolState.NOT_EXISTS)
    ) {
      return true
    }

    if (largestUsageFeeTierTvl) {
      if (!Array.isArray(largestUsageFeeTierTvl) || !(largestUsageFeeTierTvl[0] && !largestUsageFeeTier?.[1])) {
        return true
      }

      const extendedAmount0 = tryParseAmount(String(largestUsageFeeTierTvl[0]), pair?.token0)
      const extendedAmount1 = tryParseAmount(String(largestUsageFeeTierTvl[1]), pair?.token1)

      return (
        (extendedAmount0 && pair?.reserve0.greaterThan(extendedAmount0)) || (extendedAmount1 && pair?.reserve1.greaterThan(extendedAmount1))
      )
    }
    return true
  }, [
    poolsByFeeTier,
    currencyA,
    currencyB,
    handleSelectCore,
    isError,
    isPending,
    largestUsageFeeTier,
    largestUsageFeeTierTvl,
    pair,
    pairState,
  ])

  useEffect(() => {
    if (feeAmount) {
      return
    }

    if (farmExtended) {
      handleFeePoolSelect({
        type: SELECTOR_TYPE.EXTENDED,
        feeAmount: farmExtended.feeAmount,
      })
      return
    }

    if (isPending || isError) {
      return
    }

    if (!largestUsageFeeTier || CorePairHasBetterTokenAmounts) {
      // cannot recommend, open options
      setShowOptions(true)
    } else {
      setShowOptions(false)

      handleFeePoolSelect({
        type: SELECTOR_TYPE.EXTENDED,
        feeAmount: largestUsageFeeTier,
      })
    }
  }, [feeAmount, isPending, isError, largestUsageFeeTier, handleFeePoolSelect, CorePairHasBetterTokenAmounts, farmExtended])

  return (
    <HideShowSelectorSection
      showOptions={showOptions || (!CorePairHasBetterTokenAmounts && isError)}
      noHideButton={!feeAmount}
      setShowOptions={setShowOptions}
      heading={
        feeAmount ? (
          <AutoColumn gap="8px">
            <Text>
              Extended LP - {FEE_AMOUNT_DETAIL[feeAmount].label}% {t('fee tier')}
            </Text>
            {distributions && (
              <FeeTierPercentageBadge
                distributions={distributions}
                feeAmount={feeAmount}
                poolState={poolsByFeeTier[feeAmount]}
              />
            )}
          </AutoColumn>
        ) : (
          <>
            <Text>Extended LP</Text>
            {isPending && <CircleLoader />}
          </>
        )
      }
      content={
        <>
          <SelectContainer>
            {FEE_TIERS.map((_feeAmount) => {
              const { supportedChains } = FEE_AMOUNT_DETAIL[_feeAmount]
              if (chainId && supportedChains.includes(chainId)) {
                return (
                  <FeeOption
                    isLoading={isPending}
                    largestUsageFeeTier={largestUsageFeeTier}
                    feeAmount={_feeAmount}
                    active={feeAmount === _feeAmount}
                    onClick={() => handleFeePoolSelect({ type: SELECTOR_TYPE.EXTENDED, feeAmount: _feeAmount })}
                    distributions={distributions}
                    poolState={poolsByFeeTier[_feeAmount]}
                    key={_feeAmount}
                  />
                )
              }
              return null
            })}
          </SelectContainer>
          {currencyA && currencyB && handleSelectCore && (
            <AtomBox textAlign="center">
              {/*
                using state instead of replacing url to /core here
                avoid pages keep in v2 when user change the tokens in selection
              */}
              <Button variant="text" onClick={handleSelectCore}>
                <Text color="textSubtle" bold>
                  {t('Add CORE Liquidity')}
                </Text>
              </Button>
            </AtomBox>
          )}
        </>
      }
    />
  )
}
