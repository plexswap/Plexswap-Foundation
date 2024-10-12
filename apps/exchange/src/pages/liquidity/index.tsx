import { PositionDetails } from '@plexswap/farms'
import { useTranslation } from '@plexswap/localization'
import { isStableSwapSupported } from '@plexswap/hub-center/Aegis'
import {
    AddIcon,
    Button,
    ButtonMenu,
    ButtonMenuItem,
    CardBody,
    CardFooter,
    Checkbox,
    Dots,
    Flex,
    HistoryIcon,
    IconButton,
    Tag,
    Text,
    useModal
} from '@plexswap/ui-plex'
import { AppBody, AppHeader } from 'components/App'
import TransactionsModal from 'components/App/Transactions/TransactionsModal'
import { RangeTag } from 'components/RangeTag'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import useCorePairsByAccount from 'hooks/useCorePairs'
import { useExtendedPositions } from 'hooks/extended/useExtendedPositions'
import { useAtom } from 'jotai'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import React, { ReactNode, useCallback, useMemo, useState } from 'react'
import { styled } from 'styled-components'
import atomWithStorageWithErrorCatch from 'utils/atomWithStorageWithErrorCatch'
import { CHAIN_IDS } from 'utils/wagmi'
import { LiquidityCardRow } from 'views/AddLiquidity/components/LiquidityCardRow'
import { StablePairCard } from 'views/AddLiquidityExtended/components/StablePairCard'
import { CorePairCard } from 'views/AddLiquidityExtended/components/CorePairCard'
import PositionListItem from 'views/AddLiquidityExtended/formViews/ExtendedFormView/components/PoolListItem'
import Page from 'views/Page'
import useStableConfig, {
    LPStablePair,
    StableConfigContext,
    useLPTokensWithBalanceByAccount,
} from 'views/Swap/hooks/useStableConfig'

const Body = styled(CardBody)`
  background-color: ${({ theme }) => theme.colors.dropdownDeep};
`

export const StableContextProvider = (props: { pair: LPStablePair; account: string | undefined }) => {
  const stableConfig = useStableConfig({
    tokenA: props.pair?.token0,
    tokenB: props.pair?.token1,
  })

  if (!stableConfig.stableSwapConfig) return null

  return (
    <StableConfigContext.Provider value={stableConfig}>
      <StablePairCard {...props} />
    </StableConfigContext.Provider>
  )
}

enum FILTER {
  ALL = 0,
  EXTENDED = 1,
  STABLE = 2,
  CORE = 3,
}

const hideClosePositionAtom = atomWithStorageWithErrorCatch('pcs:hide-close-position', false)

function useHideClosePosition() {
  return useAtom(hideClosePositionAtom)
}

export default function PoolListPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { account, chainId } = useAccountActiveChain()

  const [selectedTypeIndex, setSelectedTypeIndex] = useState(FILTER.ALL)
  const [hideClosedPositions, setHideClosedPositions] = useHideClosePosition()

  const { positions, loading: extendedLoading } = useExtendedPositions(account)

  const { data: corePairs, loading: coreLoading } = useCorePairsByAccount(account)

  const stablePairs = useLPTokensWithBalanceByAccount(account)

  const { token0, token1, fee } = router.query as { token0: string; token1: string; fee: string }
  const isNeedFilterByQuery = useMemo(() => token0 || token1 || fee, [token0, token1, fee])
  const [showAllPositionWithQuery, setShowAllPositionWithQuery] = useState(false)

  const corePairsSection: null | ReactNode[] = corePairs?.length
    ? corePairs.map((pair, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <CorePairCard key={`${pair?.token0}-${pair?.token1}-${index}`} pair={pair} account={account} />
      ))
    : null

  const stablePairsSection: null | ReactNode[] = useMemo(() => {
    if (!stablePairs?.length) return null

    return stablePairs.map((pair) => <StableContextProvider key={pair.lpAddress} pair={pair} account={account} />)
  }, [account, stablePairs])

  const extendedPairsSection: null | React.JSX.Element[] = useMemo(() => {
    if (!positions?.length) return null

    const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
      (acc, p) => {
        acc[p.liquidity === 0n ? 1 : 0].push(p)
        return acc
      },
      [[], []],
    ) ?? [[], []]

    const filteredPositions = [
      ...openPositions,
      ...(hideClosedPositions ? [] : closedPositions.sort((p1, p2) => Number(p2.tokenId - p1.tokenId))),
    ]

    return filteredPositions.map((p) => {
      return (
        <PositionListItem key={p.tokenId.toString()} positionDetails={p}>
          {({
            currencyBase,
            currencyQuote,
            removed,
            outOfRange,
            feeAmount,
            positionSummaryLink,
            subtitle,
            setInverted,
          }) => {
            let token0Symbol = ''
            let token1Symbol = ''
            if (currencyQuote && currencyBase) {
              token0Symbol =
                currencyQuote.symbol.length > 7 ? currencyQuote.symbol.slice(0, 7).concat('...') : currencyQuote.symbol
              token1Symbol =
                currencyBase.symbol.length > 7 ? currencyBase.symbol.slice(0, 7).concat('...') : currencyBase.symbol
            }

            return (
              <LiquidityCardRow
                feeAmount={feeAmount}
                link={positionSummaryLink}
                currency0={currencyQuote}
                currency1={currencyBase}
                tokenId={p.tokenId}
                pairText={
                  !token0Symbol || !token1Symbol ? <Dots>{t('Loading')}</Dots> : `${token0Symbol}-${token1Symbol} LP`
                }
                tags={
                  <>
                    {p.isStaked && (
                      <Tag outline variant="warning" mr="8px">
                        {t('Farming')}
                      </Tag>
                    )}
                    {token0Symbol && token1Symbol ? <RangeTag removed={removed} outOfRange={outOfRange} /> : null}
                  </>
                }
                subtitle={subtitle}
                onSwitch={() => setInverted((prev) => !prev)}
              />
            )
          }}
        </PositionListItem>
      )
    })
  }, [hideClosedPositions, positions, t])

  const filteredWithQueryFilter = useMemo(() => {
    if (isNeedFilterByQuery && !showAllPositionWithQuery && extendedPairsSection) {
      return extendedPairsSection
        .filter((pair) => {
          const pairToken0 = pair?.props?.positionDetails?.token0?.toLowerCase()
          const pairToken1 = pair?.props?.positionDetails?.token1?.toLowerCase()
          const token0ToLowerCase = token0?.toLowerCase()
          const token1ToLowerCase = token1?.toLowerCase()

          if (token0 && token1 && fee) {
            if (
              ((pairToken0 === token0ToLowerCase && pairToken1 === token1ToLowerCase) ||
                (pairToken0 === token1ToLowerCase && pairToken1 === token0ToLowerCase)) &&
              pair?.props?.positionDetails?.fee === Number(fee ?? 0)
            ) {
              return pair
            }
            return null
          }

          if (token0 && (pairToken0 === token0ToLowerCase || pairToken1 === token0ToLowerCase)) {
            return pair
          }

          if (token1 && (pairToken0 === token1ToLowerCase || pairToken1 === token1ToLowerCase)) {
            return pair
          }

          if (fee && pair?.props?.positionDetails?.fee === Number(fee ?? 0)) {
            return pair
          }

          return null
        })
        .filter(Boolean)
    }

    return []
  }, [fee, isNeedFilterByQuery, showAllPositionWithQuery, token0, token1, extendedPairsSection])

  const showAllPositionButton = useMemo(() => {
    if (extendedPairsSection && filteredWithQueryFilter) {
      return (
        extendedPairsSection?.length > filteredWithQueryFilter?.length &&
        isNeedFilterByQuery &&
        !showAllPositionWithQuery &&
        !extendedLoading &&
        !coreLoading &&
        (selectedTypeIndex === FILTER.ALL || selectedTypeIndex === FILTER.EXTENDED)
      )
    }
    return false
  }, [
    filteredWithQueryFilter,
    isNeedFilterByQuery,
    showAllPositionWithQuery,
    extendedPairsSection,
    extendedLoading,
    coreLoading,
    selectedTypeIndex,
  ])

  const mainSection = useMemo(() => {
    let resultSection: null | ReactNode | (ReactNode[] | null | undefined)[]
    if (extendedLoading || coreLoading) {
      resultSection = (
        <Text color="textSubtle" textAlign="center">
          <Dots>{t('Loading')}</Dots>
        </Text>
      )
    } else if (!corePairsSection && !stablePairsSection && !filteredWithQueryFilter) {
      resultSection = (
        <Text color="textSubtle" textAlign="center">
          {t('No liquidity found.')}
        </Text>
      )
    } else {
      // Order should be  Extended, Stable and Core
      const sections = showAllPositionButton
        ? [filteredWithQueryFilter]
        : [extendedPairsSection, stablePairsSection, corePairsSection]

      resultSection = selectedTypeIndex ? sections.filter((_, index) => selectedTypeIndex === index + 1) : sections
    }

    return resultSection
  }, [
    selectedTypeIndex,
    stablePairsSection,
    t,
    coreLoading,
    corePairsSection,
    extendedLoading,
    extendedPairsSection,
    filteredWithQueryFilter,
    showAllPositionButton,
  ])

  const [onPresentTransactionsModal] = useModal(<TransactionsModal />)

  const handleClickShowAllPositions = useCallback(() => {
    setShowAllPositionWithQuery(true)
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [])

  return (
    <Page>
      <AppBody
        style={{
          maxWidth: '854px',
        }}
      >
        <AppHeader
          title={t('Your Liquidity')}
          subtitle={t('List of your liquidity positions')}
          IconSlot={
            <IconButton onClick={onPresentTransactionsModal} variant="text" scale="sm">
              <HistoryIcon color="textSubtle" width="24px" />
            </IconButton>
          }
          filter={
            <>
              <Flex as="label" htmlFor="hide-close-positions" alignItems="center">
                <Checkbox
                  id="hide-close-positions"
                  scale="sm"
                  name="confirmed"
                  type="checkbox"
                  checked={hideClosedPositions}
                  onChange={() => setHideClosedPositions((prev) => !prev)}
                />
                <Text ml="8px" color="textSubtle" fontSize="14px">
                  {t('Hide closed positions')}
                </Text>
              </Flex>

              <ButtonMenu
                scale="sm"
                activeIndex={selectedTypeIndex}
                onItemClick={(index) => setSelectedTypeIndex(index)}
                variant="subtle"
              >
                <ButtonMenuItem>{t('All')}</ButtonMenuItem>
                <ButtonMenuItem>Extended</ButtonMenuItem>
                <ButtonMenuItem display={isStableSwapSupported(chainId) ? 'inline-flex' : 'none'}>
                  {t('StableSwap')}
                </ButtonMenuItem>
                <ButtonMenuItem>CORE</ButtonMenuItem>
              </ButtonMenu>
            </>
          }
        />
        <Body>
          {mainSection}
          {showAllPositionButton && (
            <Flex alignItems="center" flexDirection="column">
              <Text color="textSubtle" mb="10px">
                {t("Don't see a pair you joined?")}
              </Text>
              <Button scale="sm" width="fit-content" variant="secondary" onClick={handleClickShowAllPositions}>
                {t('Show all positions')}
              </Button>
            </Flex>
          )}
        </Body>
        <CardFooter style={{ textAlign: 'center' }}>
          <NextLink href="/add" passHref>
            <Button id="join-pool-button" width="100%" startIcon={<AddIcon color="invertedContrast" />}>
              {t('Add Liquidity')}
            </Button>
          </NextLink>
        </CardFooter>
      </AppBody>
    </Page>
  )
}

PoolListPage.chains = CHAIN_IDS