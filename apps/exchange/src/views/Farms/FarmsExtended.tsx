import { FarmWithStakedValue, wayaSupportedChainId, coreFarmSupportedChainId, extendedFarmSupportedChainId, filterFarmsByQuery } from '@plexswap/farms'
import { useIntersectionObserver } from '@plexswap/hooks'
import { useTranslation } from '@plexswap/localization'
import {
    Box,
    Flex,
    FlexLayout,
    Heading,
    Loading,
    OptionProps,
    PageHeader,
    SearchInput,
    Select,
    Text,
    Toggle,
    ToggleView,
} from '@plexswap/ui-plex'
import partition from 'lodash/partition'

import { BIG_ONE, BIG_ZERO } from '@plexswap/utils/bigNumber'
import { FarmWidget } from '@plexswap/widgets-internal'
import BigNumber from 'bignumber.js'
import Page from 'components/Layout/Page'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useWayaPrice } from 'hooks/useWayaPrice'
import orderBy from 'lodash/orderBy'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFarms, usePollFarmsAvgInfo, usePollFarmsWithUserData } from 'state/farms/hooks'
import { CoreFarmWithoutStakedValue, ExtendedFarmWithoutStakedValue } from 'state/farms/types'
import { useFarmsExtendedWithPositionsAndBooster } from 'state/farmsExtended/hooks'
import { useWayaVaultUserData } from 'state/pools/hooks'
import { ViewMode } from 'state/user/actions'
import { useUserFarmStakedOnly, useUserFarmsViewMode } from 'state/user/hooks'
import { styled } from 'styled-components'
import { getFarmApr } from 'utils/apr'
import { getStakedFarms } from 'views/Farms/utils/getStakedFarms'
import { useAccount } from 'wagmi'
import Table from './components/FarmTable/FarmTable'
import { FarmTypesFilter } from './components/FarmTypesFilter'
import { FarmBoosterCard } from './components/YieldBooster/components/Extended/FarmBoosterCard'
import { FarmsExtendedContext } from './context'

const ControlContainer = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  position: relative;

  justify-content: space-between;
  flex-direction: column;
  margin-bottom: 32px;

  ${({ theme }) => theme.mediaQueries.sm} {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 16px 32px;
    margin-bottom: 0;
  }
`

const FarmFlexWrapper = styled(Flex)`
  flex-wrap: wrap;
  ${({ theme }) => theme.mediaQueries.md} {
    flex-wrap: nowrap;
  }
`
const FarmH1 = styled(Heading)`
  font-size: 32px;
  margin-bottom: 8px;
  ${({ theme }) => theme.mediaQueries.sm} {
    font-size: 64px;
    margin-bottom: 24px;
  }
`
const FarmH2 = styled(Heading)`
  font-size: 16px;
  margin-bottom: 8px;
  ${({ theme }) => theme.mediaQueries.sm} {
    font-size: 24px;
    margin-bottom: 18px;
  }
`

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 10px;

  ${Text} {
    margin-left: 8px;
  }
`

const LabelWrapper = styled.div`
  > ${Text} {
    font-size: 12px;
  }
`

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 0px;

  ${({ theme }) => theme.mediaQueries.sm} {
    width: auto;
    padding: 0;
  }
`

const ViewControls = styled.div`
  flex-wrap: wrap;
  justify-content: space-between;
  display: flex;
  align-items: center;
  width: 100%;

  > div {
    padding: 8px 0px;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    justify-content: flex-start;
    width: auto;

    > div {
      padding: 0;
    }
  }
`

const NUMBER_OF_FARMS_VISIBLE = 12

export interface ExtendedFarm extends ExtendedFarmWithoutStakedValue {
  version: 11
}

export interface CoreFarm extends FarmWithStakedValue {
  version: 1
}

type GlobalFarms = Array<ExtendedFarmWithoutStakedValue | CoreFarmWithoutStakedValue>

export type GlobalFarmWithStakeValue = ExtendedFarm | CoreFarm

const Farms: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { pathname, query: urlQuery } = useRouter()
  const mockApr = Boolean(urlQuery.mockApr)
  const { t } = useTranslation()
  const { chainId } = useActiveChainId()
  const { data: farmsCore, userDataLoaded: coreUserDataLoaded, poolLength: corePoolLength, regularWayaPerBlock } = useFarms()
  const {
    farmsWithPositions: farmsExtended,
    poolLength: extendedPoolLength,
    isLoading,
    userDataLoaded: extendedUserDataLoaded,
  } = useFarmsExtendedWithPositionsAndBooster({ mockApr })

  const farmsLP: GlobalFarms = useMemo(() => {
    const farms: GlobalFarms = [
      ...farmsExtended.map((f) => ({ ...f, version: 11 } as ExtendedFarmWithoutStakedValue)),
      ...farmsCore.map((f) => ({ ...f, version: 1 } as CoreFarmWithoutStakedValue)),
    ]
    return farms
  }, [farmsCore, farmsExtended, chainId])

  const wayaPrice = useWayaPrice()

  const [_query, setQuery] = useState('')
  const normalizedUrlSearch = useMemo(() => (typeof urlQuery?.search === 'string' ? urlQuery.search : ''), [urlQuery])
  const query = normalizedUrlSearch && !_query ? normalizedUrlSearch : _query

  const [viewMode, setViewMode] = useUserFarmsViewMode()
  const { address: account } = useAccount()
  const [sortOption, setSortOption] = useState('hot')
  const { observerRef, isIntersecting } = useIntersectionObserver()
  const chosenFarmsLength = useRef(0)

  const isArchived = pathname.includes('archived')
  const isInactive = pathname.includes('history')
  const isActive = !isInactive && !isArchived

  useWayaVaultUserData()

  usePollFarmsWithUserData()

  // Users with no wallet connected should see 0 as Earned amount
  // Connected users should see loading indicator until first userData has loaded
  const userDataReady =
    !account ||
    (!!account &&
      (chainId && coreFarmSupportedChainId.includes(chainId) ? coreUserDataLoaded : true) &&
      (chainId && extendedFarmSupportedChainId.includes(chainId) ? extendedUserDataLoaded : true))

  const [stakedOnly, setStakedOnly] = useUserFarmStakedOnly(isActive)
  const [extendedFarmOnly, setExtendedFarmOnly] = useState(false)
  const [coreFarmOnly, setCoreFarmOnly] = useState(false)
  const [boostedOnly, setBoostedOnly] = useState(false)
  const [stableSwapOnly, setStableSwapOnly] = useState(false)
  const [farmTypesEnableCount, setFarmTypesEnableCount] = useState(0)

  const [activeFarms, inactiveFarms] = useMemo(
    () =>
      partition(
        farmsLP,
        (farm) =>
          farm.pid !== 0 &&
          (farm.multiplier !== '0X' ||
            Boolean(farm.version === 1 && farm?.wayaWrapperAddress && farm?.wayaPublicData?.isRewardInRange)) &&
          (farm.version === 11 ? !extendedPoolLength || extendedPoolLength >= farm.pid : !corePoolLength || corePoolLength > farm.pid),
      ),
    [farmsLP, corePoolLength, extendedPoolLength],
  )

  const farmsAvgInfo = usePollFarmsAvgInfo(activeFarms)

  const archivedFarms = farmsLP

  const stakedOnlyFarms = useMemo(() => getStakedFarms(activeFarms), [activeFarms])

  const stakedInactiveFarms = useMemo(() => getStakedFarms(inactiveFarms), [inactiveFarms])

  const stakedArchivedFarms = useMemo(() => getStakedFarms(archivedFarms), [archivedFarms])

  const farmsList = useCallback(
    (farmsToDisplay: GlobalFarms): GlobalFarmWithStakeValue[] => {
      const farmsToDisplayWithAPR: any = farmsToDisplay.map((farm) => {
        if (farm.version === 11) {
          return farm
        }

        if (!farm.quoteTokenAmountTotal || !farm.quoteTokenPriceBusd) {
          return farm
        }
        const totalLiquidityFromLp = new BigNumber(farm?.lpTotalInQuoteToken ?? 0).times(farm.quoteTokenPriceBusd)
        // Mock 1$ tvl if the farm doesn't have lp staked
        const totalLiquidity = totalLiquidityFromLp.eq(BIG_ZERO) && mockApr ? BIG_ONE : totalLiquidityFromLp
        const { wayaRewardsApr, lpRewardsApr } =
          isActive && chainId
            ? getFarmApr(
                chainId,
                new BigNumber(farm?.poolWeight ?? 0),
                wayaPrice,
                totalLiquidity,
                farm.lpAddress,
                regularWayaPerBlock,
                farm.wayaPublicData?.rewardPerSecond,
              )
            : { wayaRewardsApr: 0, lpRewardsApr: 0 }
        return { ...farm, apr: wayaRewardsApr, lpRewardsApr, liquidity: totalLiquidity }
      })

      return filterFarmsByQuery(farmsToDisplayWithAPR, query)
    },
    [query, isActive, chainId, wayaPrice, regularWayaPerBlock, mockApr],
  )

  const [numberOfFarmsVisible, setNumberOfFarmsVisible] = useState(NUMBER_OF_FARMS_VISIBLE)

  const chosenFarms = useMemo(() => {
    let chosenFs: GlobalFarmWithStakeValue[] = []
    if (isActive) {
      chosenFs = stakedOnly ? farmsList(stakedOnlyFarms) : farmsList(activeFarms)
    }
    if (isInactive) {
      chosenFs = stakedOnly ? farmsList(stakedInactiveFarms) : farmsList(inactiveFarms)
    }
    if (isArchived) {
      chosenFs = stakedOnly ? farmsList(stakedArchivedFarms) : farmsList(archivedFarms)
    }

    if (extendedFarmOnly || coreFarmOnly || boostedOnly || stableSwapOnly) {
      const filterFarmsWithTypes = chosenFs.filter(
        (farm) =>
          (extendedFarmOnly && farm.version === 11) ||
          (coreFarmOnly && farm.version === 1 && !farm.isStable) ||
          (boostedOnly && farm.boosted && farm.version === 11) ||
          (stableSwapOnly && farm.version === 1 && farm.isStable),
      )

      const stakedFilterFarmsWithTypes = getStakedFarms(filterFarmsWithTypes)

      chosenFs = stakedOnly ? farmsList(stakedFilterFarmsWithTypes) : farmsList(filterFarmsWithTypes)
    }

    return chosenFs
  }, [
    isActive,
    isInactive,
    isArchived,
    stakedOnly,
    farmsList,
    stakedOnlyFarms,
    activeFarms,
    stakedInactiveFarms,
    inactiveFarms,
    stakedArchivedFarms,
    archivedFarms,
    boostedOnly,
    stableSwapOnly,
    extendedFarmOnly,
    coreFarmOnly,
  ])

  const chosenFarmsMemoized = useMemo(() => {
    const sortFarms = (farms: GlobalFarmWithStakeValue[]): GlobalFarmWithStakeValue[] => {
      switch (sortOption) {
        case 'apr':
          return orderBy(farms, (farm) => (farm.version === 11 ? Number(farm.wayaApr) : farm.apr ?? 0), 'desc')
        case 'multiplier':
          return orderBy(farms, (farm) => (farm.multiplier ? Number(farm.multiplier.slice(0, -1)) : 0), 'desc')
        case 'earned':
          return orderBy(
            farms,
            (farm) => {
              if (farm.version === 1) {
                return farm.userData ? Number(farm.userData.earnings) : 0
              }
              const totalEarned = Object.values(farm.pendingWayaByTokenIds)
                .reduce((a, b) => a + b, 0n)
                .toString()
              return account ? totalEarned : 0
            },
            'desc',
          )
        case 'liquidity':
          return orderBy(
            farms,
            (farm) => {
              if (farm.version === 11) {
                return Number(farm.activeTvlUSD)
              }
              return Number(farm.liquidity)
            },
            'desc',
          )
        case 'latest':
          return orderBy(
            orderBy(farms, (farm) => Number(farm.pid), 'desc'),
            ['version'],
            'desc',
          )
        default:
          return farms
      }
    }

    return sortFarms(chosenFarms).slice(0, numberOfFarmsVisible)
  }, [chosenFarms, numberOfFarmsVisible, sortOption, account])

  chosenFarmsLength.current = chosenFarmsMemoized.length

  useEffect(() => {
    if (isIntersecting) {
      setNumberOfFarmsVisible((farmsCurrentlyVisible) => {
        if (farmsCurrentlyVisible <= chosenFarmsLength.current) {
          return farmsCurrentlyVisible + NUMBER_OF_FARMS_VISIBLE
        }
        return farmsCurrentlyVisible
      })
    }
  }, [isIntersecting])

  const handleSortOptionChange = useCallback((option: OptionProps): void => {
    setSortOption(option.value)
  }, [])

  const handleChangeQuery = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }, [])

  const providerValue = useMemo(() => ({ chosenFarmsMemoized, farmsAvgInfo }), [chosenFarmsMemoized, farmsAvgInfo])

  return (
    <FarmsExtendedContext.Provider value={providerValue}>
      <PageHeader>
        <Flex flexDirection="column">
          <FarmFlexWrapper justifyContent="space-between">
            <Box style={{ flex: '1 1 100%' }}>
              <FarmH1 as="h1" scale="xxl" color="secondary" mb="24px">
                {t('Farms')}
              </FarmH1>
              <FarmH2 scale="lg" color="text">
                {t('Stake LP tokens to earn.')}
              </FarmH2>
            </Box>
            <Box>{wayaSupportedChainId.includes(chainId) && <FarmBoosterCard />}</Box>
          </FarmFlexWrapper>
        </Flex>
      </PageHeader>
      <Page>
        <ControlContainer>
          <ViewControls>
            <Flex mt="20px">
              <ToggleView idPrefix="clickFarm" viewMode={viewMode} onToggle={setViewMode} />
            </Flex>
            <FarmWidget.FarmTabButtons hasStakeInFinishedFarms={stakedInactiveFarms.length > 0} />
            <Flex mt="20px" ml="16px">
              <FarmTypesFilter
                extendedFarmOnly={extendedFarmOnly}
                handleSetExtendedFarmOnly={setExtendedFarmOnly}
                coreFarmOnly={coreFarmOnly}
                handleSetCoreFarmOnly={setCoreFarmOnly}
                boostedOnly={boostedOnly}
                handleSetBoostedOnly={setBoostedOnly}
                stableSwapOnly={stableSwapOnly}
                handleSetStableSwapOnly={setStableSwapOnly}
                farmTypesEnableCount={farmTypesEnableCount}
                handleSetFarmTypesEnableCount={setFarmTypesEnableCount}
              />
              <ToggleWrapper>
                <Toggle
                  id="staked-only-farms"
                  checked={stakedOnly}
                  onChange={() => setStakedOnly(!stakedOnly)}
                  scale="sm"
                />
                <Text> {t('Staked only')}</Text>
              </ToggleWrapper>
            </Flex>
          </ViewControls>
          <FilterContainer>
            <LabelWrapper>
              <Text textTransform="uppercase" color="textSubtle" fontSize="12px" bold>
                {t('Sort by')}
              </Text>
              <Select
                options={[
                  {
                    label: t('Hot'),
                    value: 'hot',
                  },
                  {
                    label: t('APR'),
                    value: 'apr',
                  },
                  {
                    label: t('Multiplier'),
                    value: 'multiplier',
                  },
                  {
                    label: t('Earned'),
                    value: 'earned',
                  },
                  {
                    label: t('Liquidity'),
                    value: 'liquidity',
                  },
                  {
                    label: t('Latest'),
                    value: 'latest',
                  },
                ]}
                onOptionChange={handleSortOptionChange}
              />
            </LabelWrapper>
            <LabelWrapper style={{ marginLeft: 16 }}>
              <Text textTransform="uppercase" color="textSubtle" fontSize="12px" bold>
                {t('Search')}
              </Text>
              <SearchInput initialValue={normalizedUrlSearch} onChange={handleChangeQuery} placeholder="Search Farms" />
            </LabelWrapper>
          </FilterContainer>
        </ControlContainer>
      
        {!isLoading &&
          (viewMode === ViewMode.TABLE ? (
            <Table farms={chosenFarmsMemoized} wayaPrice={wayaPrice} userDataReady={userDataReady} />
          ) : (
            <FlexLayout>{children}</FlexLayout>
          ))}
        {account && !coreUserDataLoaded && !extendedUserDataLoaded && stakedOnly && (
          <Flex justifyContent="center">
            <Loading />
          </Flex>
        )}
        {chosenFarms.length > 0 && <div ref={observerRef} />}
      </Page>
    </FarmsExtendedContext.Provider>
  )
}

export default Farms
