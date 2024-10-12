import { Currency } from '@plexswap/sdk-core'
import { FeeAmount } from '@plexswap/sdk-extended'
import { ChartEntry } from '@plexswap/widgets-internal'
import { TickProcessed } from 'hooks/extended/types'
import { usePoolActiveLiquidity } from 'hooks/extended/usePoolTickData'
import { useCallback, useMemo } from 'react'

export function useDensityChartData({
  currencyA,
  currencyB,
  feeAmount,
}: {
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  feeAmount: FeeAmount | undefined
}) {
  const { isLoading, error, data } = usePoolActiveLiquidity(currencyA, currencyB, feeAmount)

  const formatData = useCallback(() => {
    if (!data?.length) {
      return undefined
    }

    const newData: ChartEntry[] = []

    for (let i = 0; i < data.length; i++) {
      const t: TickProcessed = data[i]

      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price0: parseFloat(t.price0),
      }

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry)
      }
    }

    return newData
  }, [data])

  return useMemo(() => {
    return {
      isLoading,
      error,
      formattedData: !isLoading ? formatData() : undefined,
    }
  }, [isLoading, error, formatData])
}
