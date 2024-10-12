import { ComputedFarmConfigExtended, createFarmFetcherExtended, fetchTokenUSDValues } from '@plexswap/farms'
import { priceHelperTokens } from '@plexswap/farms/config/common'
import { farmsExtendedConfigChainMap } from '@plexswap/farms/config/extended'
import { Currency, ERC20Token } from '@plexswap/sdk-core'
import { FeeAmount, Pool } from '@plexswap/sdk-extended'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { FAST_INTERVAL } from 'config/constants'
import { getViemClients } from 'utils/viem'

const farmFetcherExtended = createFarmFetcherExtended(getViemClients)

interface FarmParams {
  currencyA?: Currency | null
  currencyB?: Currency | null
  feeAmount?: FeeAmount
}

export function useFarm({ currencyA, currencyB, feeAmount }: FarmParams) {
  const chainId = currencyA?.chainId
  const farmConfig = useMemo(() => {
    if (!chainId || !currencyA || !currencyB || !feeAmount) {
      return null
    }
    const farms: ComputedFarmConfigExtended[] = farmsExtendedConfigChainMap[chainId]
    if (!farms) {
      return null
    }
    const lpAddress = Pool.getAddress(currencyA.wrapped, currencyB.wrapped, feeAmount)
    const farm = farms.find((f) => f.lpAddress === lpAddress)
    return farm ?? null
  }, [chainId, currencyA, currencyB, feeAmount])

  return useQuery({
    queryKey: [chainId, farmConfig?.token0.symbol, farmConfig?.token1.symbol, farmConfig?.feeAmount],

    queryFn: async () => {
      if (!farmConfig || !chainId) {
        throw new Error('Invalid farm config')
      }
      const tokensToGetPrice: ERC20Token[] = priceHelperTokens[chainId].list || []
      for (const token of [farmConfig.token, farmConfig.quoteToken]) {
        if (tokensToGetPrice.every((t) => t.address !== token.address)) {
          tokensToGetPrice.push(token)
        }
      }

      const commonPrice = await fetchTokenUSDValues(tokensToGetPrice)

      try {
        const data = await farmFetcherExtended.fetchFarms({
          chainId,
          farms: [farmConfig],
          commonPrice,
        })

        const { farmsWithPrice, wayaPerSecond, poolLength } = data
        const farm = farmsWithPrice[0]
        return {
          farm,
          poolLength,
          wayaPerSecond,
        }
      } catch (error) {
        console.error(error)
        // return fallback for now since not all chains supported
        return null
      }
    },

    enabled: Boolean(chainId && farmConfig),
    refetchInterval: FAST_INTERVAL * 3,
    staleTime: FAST_INTERVAL,
  })
}
