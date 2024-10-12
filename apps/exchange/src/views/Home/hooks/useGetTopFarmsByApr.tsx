import { getFarmConfig } from '@plexswap/farms/config'
import { useQuery } from '@tanstack/react-query'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useWayaPrice } from 'hooks/useWayaPrice'
import orderBy from 'lodash/orderBy'
import { useEffect, useState } from 'react'
import { useAppDispatch } from 'state'
import { fetchFarmsPublicDataAsync } from 'state/farms'
import { useFarms } from 'state/farms/hooks'
import { useFarmsExtended } from 'state/farmsExtended/hooks'
import { getFarmApr } from 'utils/apr'

const useGetTopFarmsByApr = (isIntersecting: boolean) => {
  const dispatch = useAppDispatch()
  const { data: farms, regularWayaPerBlock } = useFarms()
  const { data: farmsExtended, isLoading } = useFarmsExtended()
  const [topFarms, setTopFarms] = useState<
    ({
      lpSymbol: string
      apr: number | null
      lpRewardsApr: number
      version: 1 | 11
    } | null)[]
  >(() => [null, null, null, null, null])
  const wayaPrice = useWayaPrice()
  const { chainId } = useActiveChainId()

  const { status: fetchStatus, isFetching } = useQuery({
    queryKey: [chainId, 'fetchTopFarmsByApr'],

    queryFn: async () => {
      if (!chainId) return undefined
      const farmsConfig = await getFarmConfig(chainId)
      const activeFarms = farmsConfig?.filter((farm) => farm.pid !== 0)
      return dispatch(fetchFarmsPublicDataAsync({ pids: activeFarms?.map((farm) => farm.pid) ?? [], chainId }))
    },

    enabled: Boolean(isIntersecting && chainId),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (fetchStatus === 'success' && farms?.length > 0 && !isLoading) {
      const farmsWithPrices = farms.filter(
        (farm) =>
          farm.lpTotalInQuoteToken &&
          farm.quoteTokenPriceBusd &&
          farm.pid !== 0 &&
          farm.multiplier &&
          farm.multiplier !== '0X',
      )
      const farmsWithApr = farmsWithPrices.map((farm) => {
        const totalLiquidity = farm?.quoteTokenPriceBusd
          ? farm?.lpTotalInQuoteToken?.times(farm.quoteTokenPriceBusd)
          : undefined
        const { wayaRewardsApr, lpRewardsApr } = getFarmApr(
          chainId,
          farm.poolWeight,
          wayaPrice,
          totalLiquidity,
          farm.lpAddress,
          regularWayaPerBlock,
        )
        return { ...farm, apr: wayaRewardsApr, lpRewardsApr, version: 1 as const }
      })

      const activeFarmExtended = farmsExtended.farmsWithPrice
        .filter((f) => f.multiplier !== '0X' && 'wayaApr' in f)
        .map((f) => ({
          ...f,
          apr: f.wayaApr ? +f.wayaApr : Number.NaN,
          // lpRewardsApr missing
          lpRewardsApr: 0,
          version: 11 as const,
        }))

      const sortedByApr = orderBy(
        [...farmsWithApr, ...activeFarmExtended],
        (farm) => (farm.apr !== null ? farm.apr + farm.lpRewardsApr : farm.lpRewardsApr),
        'desc',
      )
      setTopFarms(sortedByApr.slice(0, 5))
    }
  }, [wayaPrice, chainId, farms, farmsExtended.farmsWithPrice, fetchStatus, isLoading, regularWayaPerBlock])
  return { topFarms, fetched: fetchStatus === 'success' && !isFetching, chainId }
}

export default useGetTopFarmsByApr