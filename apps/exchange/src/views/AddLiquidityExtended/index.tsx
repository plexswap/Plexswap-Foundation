import { CurrencySelect } from 'components/CurrencySelect'
import { CommonBasesType } from 'components/SearchModal/types'

import { Currency, NATIVE, WNATIVE } from '@plexswap/sdk-core'
import {
    AddIcon,
    AutoColumn,
    CardBody,
    DynamicSection,
    FlexGap,
    IconButton,
    PreTitle,
    RefreshIcon,
    LargeBodyWrapper as BodyWrapper
} from '@plexswap/ui-plex'

import { FeeAmount } from '@plexswap/sdk-extended'
import React, { ReactNode, useCallback, useEffect, useMemo } from 'react'

import { Trans, useTranslation } from '@plexswap/localization'
import { useRouter } from 'next/router'
import currencyId from 'utils/currencyId'

import { AppHeader } from 'components/App'
import { atom, useAtom } from 'jotai'
import { styled } from 'styled-components'
import Page from 'views/Page'

import { usePreviousValue } from '@plexswap/hooks'
import { useCurrency } from 'hooks/Tokens'
import AddLiquidity from 'views/AddLiquidity'
import AddStableLiquidity from 'views/AddLiquidity/AddStableLiquidity'
import useStableConfig, { StableConfigContext } from 'views/Swap/hooks/useStableConfig'

import { useActiveChainId } from 'hooks/useActiveChainId'
import noop from 'lodash/noop'
import { resetMintState } from 'state/mint/actions'
import { useAddLiquidityFormDispatch } from 'state/mint/reducer'
import { useStableSwapPairs } from 'state/swap/useStableSwapPairs'
import { safeGetAddress } from 'utils'
import FeeSelector from './formViews/ExtendedFormView/components/FeeSelector'

import { AprCalculator } from './components/AprCalculator'
import { StableExtendedSelector } from './components/StableExtendedSelector'
import { CoreSelector } from './components/CoreSelector'
import ExtendedFormView from './formViews/ExtendedFormView'
import StableFormView from './formViews/StableFormView'
import CoreFormView from './formViews/CoreFormView'
import { useCurrencyParams } from './hooks/useCurrencyParams'
import { HandleFeePoolSelectFn, SELECTOR_TYPE } from './types'

/* two-column layout where DepositAmount is moved at the very end on mobile. */
export const ResponsiveTwoColumns = styled.div`
  display: grid;
  grid-column-gap: 32px;
  grid-row-gap: 16px;
  grid-template-columns: 1fr;

  grid-template-rows: max-content;
  grid-auto-flow: row;

  ${({ theme }) => theme.mediaQueries.md} {
    grid-template-columns: 1fr 1fr;
  }
`

const selectTypeAtom = atom(SELECTOR_TYPE.EXTENDED)

interface AddLiquidityExtendedPropsType {
  currencyIdA?: string
  currencyIdB?: string
  preferredSelectType?: SELECTOR_TYPE
  preferredFeeAmount?: FeeAmount
}

export function AddLiquidityExtended({
  currencyIdA,
  currencyIdB,
  preferredSelectType,
  preferredFeeAmount,
}: AddLiquidityExtendedPropsType) {
  const { chainId } = useActiveChainId()
  const { t } = useTranslation()

  const dispatch = useAddLiquidityFormDispatch()

  useEffect(() => {
    if (!currencyIdA && !currencyIdB) {
      dispatch(resetMintState())
    }
  }, [dispatch, currencyIdA, currencyIdB])

  const router = useRouter()
  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const stableConfig = useStableConfig({
    tokenA: baseCurrency,
    tokenB: currencyB,
  })

  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

  const [, , feeAmountFromUrl] = router.query.currency || []

  // fee selection from url
  const feeAmount: FeeAmount | undefined = useMemo(() => {
    return (
      preferredFeeAmount ||
      (feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
        ? parseFloat(feeAmountFromUrl)
        : undefined)
    )
  }, [preferredFeeAmount, feeAmountFromUrl])

  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      }
      // prevent wnative + native
      const isNATIVEOrWNATIVENew =
        currencyNew?.isNative || (chainId !== undefined && currencyIdNew === WNATIVE[chainId]?.address)
      const isNATIVEOrWNATIVEOther =
        currencyIdOther !== undefined &&
        ((chainId && currencyIdOther === NATIVE[chainId]?.symbol) ||
          (chainId !== undefined && safeGetAddress(currencyIdOther) === WNATIVE[chainId]?.address))

      if (isNATIVEOrWNATIVENew && isNATIVEOrWNATIVEOther) {
        return [currencyIdNew, undefined]
      }

      return [currencyIdNew, currencyIdOther]
    },
    [chainId],
  )

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB)
      const newPathname = router.pathname.replace('/core', '').replace('/stable', '')
      if (idB === undefined) {
        router.replace(
          {
            pathname: newPathname,
            query: {
              ...router.query,
              currency: [idA!],
            },
          },
          undefined,
          { shallow: true },
        )
      } else {
        router.replace(
          {
            pathname: newPathname,
            query: {
              ...router.query,
              currency: [idA!, idB!],
            },
          },
          undefined,
          { shallow: true },
        )
      }
    },
    [handleCurrencySelect, currencyIdB, router],
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      const newPathname = router.pathname.replace('/core', '').replace('/stable', '')
      if (idA === undefined) {
        router.replace(
          {
            pathname: newPathname,
            query: {
              ...router.query,
              currency: [idB!],
            },
          },
          undefined,
          { shallow: true },
        )
      } else {
        router.replace(
          {
            pathname: newPathname,
            query: {
              ...router.query,
              currency: [idA!, idB!],
            },
          },
          undefined,
          { shallow: true },
        )
      }
    },
    [handleCurrencySelect, currencyIdA, router],
  )

  const [selectorType, setSelectorType] = useAtom(selectTypeAtom)

  const prevPreferredSelectType = usePreviousValue(preferredSelectType)

  useEffect(() => {
    if (!currencyIdA || !currencyIdB) return

    if (selectorType === SELECTOR_TYPE.EXTENDED && preferredSelectType === SELECTOR_TYPE.EXTENDED) {
      return
    }

    // if fee selection from url, don't change the selector type to avoid keep selecting stable when url changes, e.g. toggle rate
    if (!stableConfig.stableSwapConfig && feeAmountFromUrl) return
    if (preferredSelectType === SELECTOR_TYPE.STABLE && stableConfig.stableSwapConfig) {
      setSelectorType(SELECTOR_TYPE.STABLE)
    } else {
      setSelectorType(preferredSelectType || SELECTOR_TYPE.EXTENDED)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currencyIdA,
    currencyIdB,
    feeAmountFromUrl,
    preferredSelectType,
    prevPreferredSelectType,
    setSelectorType,
    stableConfig.stableSwapConfig,
  ])

  const handleFeePoolSelect = useCallback<HandleFeePoolSelectFn>(
    ({ type, feeAmount: newFeeAmount }) => {
      setSelectorType(type)
      if (type === SELECTOR_TYPE.EXTENDED) {
        const newPathname = router.pathname.replace('/stable', '').replace('/core', '')
        router.replace(
          {
            pathname: newPathname,
            query: {
              ...router.query,
              currency: newFeeAmount
                ? [currencyIdA!, currencyIdB!, newFeeAmount.toString()]
                : [currencyIdA!, currencyIdB!],
            },
          },
          undefined,
          { shallow: true },
        )
      } else {
        router.replace(
          {
            pathname: router.pathname,
            query: router.query,
          },
          type === SELECTOR_TYPE.STABLE
            ? `/stable/add/${currencyIdA}/${currencyIdB}`
            : `/core/add/${currencyIdA}/${currencyIdB}`,
          { shallow: true },
        )
      }
    },
    [currencyIdA, currencyIdB, router, setSelectorType],
  )

  useEffect(() => {
    if (preferredFeeAmount && !feeAmountFromUrl && selectorType === SELECTOR_TYPE.EXTENDED) {
      handleFeePoolSelect({ type: selectorType, feeAmount: preferredFeeAmount })
    }
  }, [preferredFeeAmount, feeAmountFromUrl, handleFeePoolSelect, selectorType])

  return (
    <>
      <CardBody>
        <ResponsiveTwoColumns>
          <AutoColumn alignSelf="stretch">
            <PreTitle mb="8px">{t('Choose Token Pair')}</PreTitle>
            <FlexGap gap="4px" width="100%" mb="8px" alignItems="center">
              <CurrencySelect
                id="add-liquidity-select-tokena"
                selectedCurrency={baseCurrency}
                onCurrencySelect={handleCurrencyASelect}
                showCommonBases
                commonBasesType={CommonBasesType.LIQUIDITY}
                hideBalance
              />
              <AddIcon color="textSubtle" />
              <CurrencySelect
                id="add-liquidity-select-tokenb"
                selectedCurrency={quoteCurrency}
                onCurrencySelect={handleCurrencyBSelect}
                showCommonBases
                commonBasesType={CommonBasesType.LIQUIDITY}
                hideBalance
              />
            </FlexGap>
            <DynamicSection disabled={!baseCurrency || !currencyB}>
              {preferredSelectType !== SELECTOR_TYPE.CORE &&
                stableConfig.stableSwapConfig &&
                [SELECTOR_TYPE.STABLE, SELECTOR_TYPE.EXTENDED].includes(selectorType) && (
                  <StableExtendedSelector
                    currencyA={baseCurrency ?? undefined}
                    currencyB={quoteCurrency ?? undefined}
                    feeAmount={feeAmount}
                    selectorType={selectorType}
                    handleFeePoolSelect={handleFeePoolSelect}
                  />
                )}

              {((preferredSelectType === SELECTOR_TYPE.CORE && selectorType !== SELECTOR_TYPE.EXTENDED) ||
                selectorType === SELECTOR_TYPE.CORE) && (
                <CoreSelector
                  isStable={Boolean(stableConfig.stableSwapConfig)}
                  selectorType={selectorType}
                  handleFeePoolSelect={({ type }) => {
                    // keep using state instead of replacing url in UniversalLiquidity
                    handleFeePoolSelect({ type })
                  }}
                />
              )}

              {!stableConfig.stableSwapConfig && selectorType === SELECTOR_TYPE.EXTENDED && (
                <FeeSelector
                  currencyA={baseCurrency ?? undefined}
                  currencyB={quoteCurrency ?? undefined}
                  handleFeePoolSelect={handleFeePoolSelect}
                  feeAmount={feeAmount}
                  handleSelectCore={() => handleFeePoolSelect({ type: SELECTOR_TYPE.CORE })}
                />
              )}
            </DynamicSection>
          </AutoColumn>
          {selectorType === SELECTOR_TYPE.STABLE && (
            <StableConfigContext.Provider value={stableConfig}>
              <AddStableLiquidity currencyA={baseCurrency} currencyB={quoteCurrency}>
                {(props) => <StableFormView {...props} stableLpFee={stableConfig?.stableSwapConfig?.stableLpFee} />}
              </AddStableLiquidity>
            </StableConfigContext.Provider>
          )}
          {selectorType === SELECTOR_TYPE.EXTENDED && (
            <ExtendedFormView
              feeAmount={feeAmount}
              baseCurrency={baseCurrency}
              quoteCurrency={quoteCurrency}
              currencyIdA={currencyIdA}
              currencyIdB={currencyIdB}
            />
          )}
          {selectorType === SELECTOR_TYPE.CORE && (
            <AddLiquidity currencyA={baseCurrency} currencyB={quoteCurrency}>
              {(props) => <CoreFormView {...props} />}
            </AddLiquidity>
          )}
        </ResponsiveTwoColumns>
      </CardBody>
    </>
  )
}

const SELECTOR_TYPE_T = {
  [SELECTOR_TYPE.STABLE]: <Trans>Add Stable Liquidity</Trans>,
  [SELECTOR_TYPE.CORE]: <Trans>Add CORE Liquidity</Trans>,
  [SELECTOR_TYPE.EXTENDED]: <Trans>Add Extended Liquidity</Trans>,
} as const satisfies Record<SELECTOR_TYPE, ReactNode>

export function AddLiquidityExtendedLayout({
  showRefreshButton = false,
  preferredSelectType,
  handleRefresh,
  children,
}: {
  showRefreshButton?: boolean
  preferredSelectType?: SELECTOR_TYPE
  handleRefresh?: () => void
  children: React.ReactNode
}) {
  const { t } = useTranslation()

  const [selectType] = useAtom(selectTypeAtom)
  const { currencyIdA, currencyIdB, feeAmount } = useCurrencyParams()

  const baseCurrency = useCurrency(currencyIdA)
  const quoteCurrency = useCurrency(currencyIdB)

  const title = SELECTOR_TYPE_T[selectType] || t('Add Liquidity')

  const lpTokens = useStableSwapPairs()

  const backToLink = useMemo(() => {
    if (preferredSelectType === SELECTOR_TYPE.CORE) {
      return `/core/pair/${currencyIdA}/${currencyIdB}`
    }
    if (preferredSelectType === SELECTOR_TYPE.STABLE) {
      const selectedLp = lpTokens.find(
        ({ token0, token1 }) =>
          token0?.wrapped?.address?.toLowerCase() === baseCurrency?.wrapped?.address?.toLowerCase() &&
          token1?.wrapped?.address?.toLowerCase() === quoteCurrency?.wrapped?.address?.toLowerCase(),
      )
      return `/stable/${selectedLp?.lpAddress}`
    }
    return '/liquidity'
  }, [lpTokens, baseCurrency, quoteCurrency, currencyIdA, currencyIdB, preferredSelectType])

  return (
    <Page>
      <BodyWrapper>
        <AppHeader
          title={title}
          backTo={backToLink}
          IconSlot={
            <>
              {selectType === SELECTOR_TYPE.EXTENDED && (
                <AprCalculator
                  showQuestion
                  baseCurrency={baseCurrency}
                  quoteCurrency={quoteCurrency}
                  feeAmount={feeAmount}
                />
              )}
              {showRefreshButton && (
                <IconButton variant="text" scale="sm">
                  <RefreshIcon onClick={handleRefresh || noop} color="textSubtle" height={24} width={24} />
                </IconButton>
              )}
            </>
          }
        />
        {children}
      </BodyWrapper>
    </Page>
  )
}
