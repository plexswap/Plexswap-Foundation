import { useTranslation } from '@plexswap/localization'
import { AutoColumn, Message, MessageText, Text } from '@plexswap/ui-plex'
import { useEffect, useMemo, useState } from 'react'

import { Currency } from '@plexswap/sdk-core'
import { FeeAmount } from '@plexswap/sdk-extended'
import { EvenWidthAutoRow } from 'components/Layout/EvenWidthAutoRow'
import { SelectButton } from 'components/SelectButton'
import { PoolState } from 'hooks/extended/types'
import { useFeeTierDistribution } from 'hooks/extended/useFeeTierDistribution'
import { usePools } from 'hooks/extended/usePools'

import { useActiveChainId } from 'hooks/useActiveChainId'
import { FeeOption } from '../formViews/ExtendedFormView/components/FeeOption'
import { FEE_AMOUNT_DETAIL, SelectContainer } from '../formViews/ExtendedFormView/components/shared'
import { HandleFeePoolSelectFn, SELECTOR_TYPE } from '../types'
import HideShowSelectorSection from './HideShowSelectorSection'

export function StableExtendedSelector({
  handleFeePoolSelect,
  selectorType,
  feeAmount,
  currencyA,
  currencyB,
}: {
  selectorType: SELECTOR_TYPE
  feeAmount?: FeeAmount
  currencyA?: Currency | null
  currencyB?: Currency | null
  handleFeePoolSelect: HandleFeePoolSelectFn
}) {
  const { t } = useTranslation()
  const [showOptions, setShowOptions] = useState(false)
  const { chainId } = useActiveChainId()

  const { isPending, isError, largestUsageFeeTier, distributions } = useFeeTierDistribution(currencyA, currencyB)

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

  const poolsByFeeTier = useMemo(
    () =>
      pools.reduce(
        (acc, [curPoolState, curPool]) => {
          return {
            ...acc,
            ...{ [curPool?.fee as FeeAmount]: curPoolState },
          }
        },
        {
          // default all states to NOT_EXISTS
          [FeeAmount.LOWEST]: PoolState.NOT_EXISTS,
          [FeeAmount.LOW]: PoolState.NOT_EXISTS,
          [FeeAmount.MEDIUM]: PoolState.NOT_EXISTS,
          [FeeAmount.HIGH]: PoolState.NOT_EXISTS,
        } as Record<FeeAmount, PoolState>,
      ),
    [pools],
  )

  useEffect(() => {
    if (feeAmount || isPending || isError || selectorType === SELECTOR_TYPE.STABLE) {
      return
    }

    if (!largestUsageFeeTier) {
      // cannot recommend, open options
      setShowOptions(true)
    } else {
      setShowOptions(false)

      handleFeePoolSelect({
        type: SELECTOR_TYPE.EXTENDED,
        feeAmount: largestUsageFeeTier,
      })
    }
  }, [feeAmount, isPending, isError, largestUsageFeeTier, handleFeePoolSelect, selectorType])

  return (
    <HideShowSelectorSection
      showOptions={showOptions}
      setShowOptions={setShowOptions}
      heading={
        selectorType === SELECTOR_TYPE.STABLE ? (
          <AutoColumn>
            <Text>StableSwap LP</Text>
          </AutoColumn>
        ) : chainId && FEE_AMOUNT_DETAIL[FeeAmount.LOWEST]?.supportedChains.includes(chainId) ? (
          <AutoColumn>
            <Text>
              Extended LP{' '}
              {feeAmount && FEE_AMOUNT_DETAIL[feeAmount]?.label
                ? `- ${FEE_AMOUNT_DETAIL[feeAmount]?.label}% ${t('fee tier')}`
                : ''}
            </Text>
          </AutoColumn>
        ) : null
      }
      content={
        <AutoColumn gap="8px">
          <EvenWidthAutoRow gap="8px">
            <SelectButton
              isActive={selectorType === SELECTOR_TYPE.STABLE}
              onClick={() => handleFeePoolSelect({ type: SELECTOR_TYPE.STABLE })}
            >
              StableSwap LP
            </SelectButton>
            {chainId && FEE_AMOUNT_DETAIL[FeeAmount.LOWEST]?.supportedChains.includes(chainId) && (
              <SelectButton
                isActive={selectorType === SELECTOR_TYPE.EXTENDED}
                onClick={() => handleFeePoolSelect({ type: SELECTOR_TYPE.EXTENDED })}
              >
                Extended LP
              </SelectButton>
            )}
          </EvenWidthAutoRow>
          {selectorType === SELECTOR_TYPE.EXTENDED && (
            <SelectContainer>
              {[FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH].map((_feeAmount) => {
                const { supportedChains } = FEE_AMOUNT_DETAIL[_feeAmount]
                if (chainId && supportedChains.includes(chainId)) {
                  return (
                    <FeeOption
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
          )}
          <Message variant="warning">
            <MessageText>
              {t(
                'Stable coins work best with StableSwap LPs. Adding Extended or Core LP may result in less fee earning or inability to perform yield farming.',
              )}
            </MessageText>
          </Message>
        </AutoColumn>
      }
    />
  )
}
