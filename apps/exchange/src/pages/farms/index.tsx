import { SUPPORT_FARMS } from 'config/constants/supportedChains'
import { useWayaPrice } from 'hooks/useWayaPrice'
import { useContext } from 'react'
import { FarmsExtendedContext, FarmsExtendedPageLayout } from 'views/Farms'
import { FarmExtendedCard } from 'views/Farms/components/FarmCard/Extended/FarmExtendedCard'
import FarmCard from 'views/Farms/components/FarmCard/FarmCard'
import ProxyFarmContainer, {
    YieldBoosterStateContext,
} from 'views/Farms/components/YieldBooster/components/ProxyFarmContainer'
import { getDisplayApr } from 'views/Farms/components/getDisplayApr'
import { useAccount } from 'wagmi'

export const ProxyFarmCardContainer = ({ farm }) => {
  const { address: account } = useAccount()
  const wayaPrice = useWayaPrice()

  const { proxyFarm, shouldUseProxyFarm } = useContext(YieldBoosterStateContext)
  const finalFarm = shouldUseProxyFarm ? proxyFarm : farm

  return (
    <FarmCard
      key={finalFarm.pid}
      farm={finalFarm}
      displayApr={getDisplayApr(
        finalFarm.wayaWrapperAddress && finalFarm?.wayaPublicData?.rewardPerSecond === 0 ? 0 : finalFarm.apr,
        finalFarm.lpRewardsApr,
      )}
      wayaPrice={wayaPrice}
      account={account}
      removed={false}
    />
  )
}

const FarmsPage = () => {
  const { address: account } = useAccount()
  const { chosenFarmsMemoized } = useContext(FarmsExtendedContext)
  const wayaPrice = useWayaPrice()

  return (
    <>
      {chosenFarmsMemoized?.map((farm) => {
        if (farm.version === 1) {
          return farm.boosted ? (
            <ProxyFarmContainer farm={farm} key={`${farm.pid}-${farm.version}`}>
              <ProxyFarmCardContainer farm={farm} />
            </ProxyFarmContainer>
          ) : (
            <>
              <FarmCard
                key={`${farm.pid}-${farm.version}`}
                farm={farm}
                displayApr={getDisplayApr(
                  farm.wayaWrapperAddress && farm?.wayaPublicData?.rewardPerSecond === 0 ? 0 : farm.apr,
                  farm.lpRewardsApr,
                )}
                wayaPrice={wayaPrice}
                account={account}
                removed={false}
              />
            </>
          )
        }

        return (
          <FarmExtendedCard
            key={`${farm.pid}-${farm.version}`}
            farm={farm}
            wayaPrice={wayaPrice}
            account={account}
            removed={false}
          />
        )
      })}
    </>
  )
}

FarmsPage.Layout = FarmsExtendedPageLayout

FarmsPage.chains = SUPPORT_FARMS

export default FarmsPage