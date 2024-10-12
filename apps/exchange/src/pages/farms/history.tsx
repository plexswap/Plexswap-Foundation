import { SUPPORT_FARMS } from 'config/constants/supportedChains'
import { useWayaPrice } from 'hooks/useWayaPrice'
import { useContext } from 'react'
import { FarmsExtendedContext, FarmsExtendedPageLayout } from 'views/Farms'
import { FarmExtendedCard } from 'views/Farms/components/FarmCard/Extended/FarmExtendedCard'
import FarmCard from 'views/Farms/components/FarmCard/FarmCard'
import ProxyFarmContainer from 'views/Farms/components/YieldBooster/components/ProxyFarmContainer'
import { getDisplayApr } from 'views/Farms/components/getDisplayApr'
import { useAccount } from 'wagmi'
import { ProxyFarmCardContainer } from '.'

const FarmsHistoryPage = () => {
  const { address: account } = useAccount()
  const { chosenFarmsMemoized } = useContext(FarmsExtendedContext)
  const wayaPrice = useWayaPrice()

  return (
    <>
      {chosenFarmsMemoized?.map((farm) => {
        if (farm.version === 1) {
          return farm.boosted ? (
            <ProxyFarmContainer farm={farm} key={farm.pid}>
              <ProxyFarmCardContainer farm={farm} />
            </ProxyFarmContainer>
          ) : (
            <FarmCard
              key={farm.pid}
              farm={farm}
              displayApr={getDisplayApr(farm.apr, farm.lpRewardsApr)}
              wayaPrice={wayaPrice}
              account={account}
              removed={false}
            />
          )
        }
        return <FarmExtendedCard key={farm.pid} farm={farm} wayaPrice={wayaPrice} account={account} removed={false} />
      })}
    </>
  )
}

FarmsHistoryPage.Layout = FarmsExtendedPageLayout

FarmsHistoryPage.chains = SUPPORT_FARMS

export default FarmsHistoryPage
