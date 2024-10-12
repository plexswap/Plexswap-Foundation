import { ChainId } from '@plexswap/chains'
import { DeserializedFarm, FarmWithStakedValue, filterFarmsByQuery } from '@plexswap/farms'
import { useIntersectionObserver } from '@plexswap/hooks'
import { useTranslation } from '@plexswap/localization'
import { FarmWidget } from '@plexswap/widgets-internal'
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
  ToggleView
} from '@plexswap/ui-plex'

import BigNumber from 'bignumber.js'
import Page from 'components/Layout/Page'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useWayaPrice } from 'hooks/useWayaPrice'
import orderBy from 'lodash/orderBy'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFarms, usePollFarmsWithUserData } from 'state/farms/hooks'
import { useWayaVaultUserData } from 'state/pools/hooks'
import { ViewMode } from 'state/user/actions'
import { useUserFarmStakedOnly, useUserFarmsViewMode } from 'state/user/hooks'
import { styled } from 'styled-components'
import { getFarmApr } from 'utils/apr'
import { getStakedMinProgramFarms } from 'views/Farms/utils/getStakedMinProgramFarms'
import { useAccount } from 'wagmi'
import { CoreFarm } from './FarmsExtended'
import Table from './components/FarmTable/FarmTable'
import { FarmTypesFilter } from './components/FarmTypesFilter'
import { FarmBoosterCard } from './components/YieldBooster/components/Extended/FarmBoosterCard'
import { FarmsContext } from './context'
import useMultiChainHarvestModal from './hooks/useMultiChainHarvestModal'

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

const Farms: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { pathname, query: urlQuery } = useRouter()
  const { t } = useTranslation()
  const { chainId } = useActiveChainId()
  const { data: farmsLP, userDataLoaded, poolLength, regularWayaPerBlock } = useFarms()

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

  useMultiChainHarvestModal()

  // Users with no wallet connected should see 0 as Earned amount
  // Connected users should see loading indicator until first userData has loaded
  const userDataReady = !account || (!!account && userDataLoaded)

  const [stakedOnly, setStakedOnly] = useUserFarmStakedOnly(isActive)
  const [boostedOnly, setBoostedOnly] = useState(false)
  const [stableSwapOnly, setStableSwapOnly] = useState(false)
  const [farmTypesEnableCount, setFarmTypesEnableCount] = useState(0)

  const activeFarms = useMemo(
    () =>
      farmsLP.filter(
        (farm) =>
          farm.pid !== 0 &&
          farm.multiplier !== '0X' &&
          (!poolLength || poolLength > farm.pid),
      ),
    [farmsLP, poolLength],
  )

  const inactiveFarms = useMemo(
    () =>
      farmsLP.filter(
        (farm) =>
          (farm.pid !== 0 && farm.multiplier === '0X'),
      ),
    [farmsLP],
  )
  const archivedFarms = farmsLP

  const stakedOnlyFarms = useMemo(() => getStakedMinProgramFarms(activeFarms), [activeFarms])

  const stakedInactiveFarms = useMemo(() => getStakedMinProgramFarms(inactiveFarms), [inactiveFarms])

  const stakedArchivedFarms = useMemo(() => getStakedMinProgramFarms(archivedFarms), [archivedFarms])

  const farmsList = useCallback(
    (farmsToDisplay: DeserializedFarm[]): FarmWithStakedValue[] => {
      const farmsToDisplayWithAPR: FarmWithStakedValue[] = farmsToDisplay.map((farm) => {
        if (!farm.lpTotalInQuoteToken || !farm.quoteTokenPriceBusd) {
          return farm
        }

        const totalLiquidity = new BigNumber(farm.lpTotalInQuoteToken).times(farm.quoteTokenPriceBusd)
        const { wayaRewardsApr, lpRewardsApr } =
          isActive && chainId
            ? getFarmApr(
                chainId,
                new BigNumber(farm?.poolWeight ?? 0),
                wayaPrice,
                totalLiquidity,
                farm.lpAddress,
                regularWayaPerBlock,
              )
            : { wayaRewardsApr: 0, lpRewardsApr: 0 }

        return { ...farm, apr: wayaRewardsApr ?? undefined, lpRewardsApr, liquidity: totalLiquidity }
      })

      return filterFarmsByQuery(farmsToDisplayWithAPR, query)
    },
    [query, isActive, chainId, wayaPrice, regularWayaPerBlock],
  )

  const handleChangeQuery = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }, [])

  const [numberOfFarmsVisible, setNumberOfFarmsVisible] = useState(NUMBER_OF_FARMS_VISIBLE)

  const chosenFarms = useMemo(() => {
    let chosenFs: FarmWithStakedValue[] = []
    if (isActive) {
      chosenFs = stakedOnly ? farmsList(stakedOnlyFarms) : farmsList(activeFarms)
    }
    if (isInactive) {
      chosenFs = stakedOnly ? farmsList(stakedInactiveFarms) : farmsList(inactiveFarms)
    }
    if (isArchived) {
      chosenFs = stakedOnly ? farmsList(stakedArchivedFarms) : farmsList(archivedFarms)
    }

    if (boostedOnly || stableSwapOnly) {
      const boostedOrStableSwapFarms = chosenFs.filter(
        (farm) => 
	  (boostedOnly && farm.boosted) || 
	  (stableSwapOnly && farm.isStable),
      )

      const stakedBoostedOrStableSwapFarms = getStakedMinProgramFarms(boostedOrStableSwapFarms)

      chosenFs = stakedOnly ? farmsList(stakedBoostedOrStableSwapFarms) : farmsList(boostedOrStableSwapFarms)
    }

    return chosenFs
  }, [
    activeFarms,
    farmsList,
    inactiveFarms,
    archivedFarms,
    isActive,
    isInactive,
    isArchived,
    stakedArchivedFarms,
    stakedInactiveFarms,
    stakedOnly,
    stakedOnlyFarms,
    boostedOnly,
    stableSwapOnly,
  ])

  const chosenFarmsMemoized = useMemo(() => {
    const sortFarms = (farms: FarmWithStakedValue[]): FarmWithStakedValue[] => {
      switch (sortOption) {
        case 'apr':
          return orderBy(farms, (farm: FarmWithStakedValue) => Number(farm.apr) + Number(farm.lpRewardsApr), 'desc')
        case 'multiplier':
          return orderBy(
            farms,
            (farm: FarmWithStakedValue) => (farm.multiplier ? Number(farm.multiplier.slice(0, -1)) : 0),
            'desc',
          )
        case 'earned':
          return orderBy(
            farms,
            (farm: FarmWithStakedValue) => (farm.userData ? Number(farm.userData.earnings) : 0),
            'desc',
          )
        case 'liquidity':
          return orderBy(farms, (farm: FarmWithStakedValue) => Number(farm.liquidity), 'desc')
        case 'latest':
          return orderBy(
            orderBy(farms, (farm: FarmWithStakedValue) => Number(farm.pid), 'desc'),
            ['version'],
            'desc',
          )
        default:
          return farms
      }
    }

    return sortFarms(chosenFarms).slice(0, numberOfFarmsVisible)
  }, [chosenFarms, sortOption, numberOfFarmsVisible])

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

  const providerValue = useMemo(() => ({ chosenFarmsMemoized }), [chosenFarmsMemoized])

  return (
    <FarmsContext.Provider value={providerValue}>
      <PageHeader>
        <Flex flexDirection="column">
          <FarmFlexWrapper justifyContent="space-between">
            <Box>
              <FarmH1 as="h1" scale="xxl" color="secondary" mb="24px">
                {t('Farms')}
              </FarmH1>
              <FarmH2 scale="lg" color="text">
                {t('Stake LP tokens to earn.')}
              </FarmH2>
            </Box>
            {(chainId === ChainId.BSC || chainId === ChainId.PLEXCHAIN ) && (
              <Box>
                <FarmBoosterCard />
              </Box>
            )}
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
        {viewMode === ViewMode.TABLE ? (
          <Table farms={chosenFarmsMemoized as CoreFarm[]} wayaPrice={wayaPrice} userDataReady={userDataReady} />
        ) : (
          <FlexLayout>{children}</FlexLayout>
        )}
        {account && !userDataLoaded && stakedOnly && (
          <Flex justifyContent="center">
            <Loading />
          </Flex>
        )}
        {poolLength && <div ref={observerRef} />}
      </Page>
    </FarmsContext.Provider>
  )
}

export default Farms