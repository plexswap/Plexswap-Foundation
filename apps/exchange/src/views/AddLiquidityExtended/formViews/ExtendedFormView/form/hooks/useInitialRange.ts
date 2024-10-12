import { Token } from '@plexswap/sdk-core'
import { tryParsePrice } from 'hooks/extended/utils'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import { useExtendedFormState } from '../reducer'
import { useExtendedMintActionHandlers } from './useExtendedMintActionHandlers'

export const useInitialRange = (baseToken?: Token, quoteToken?: Token) => {
  const { query } = useRouter()
  const { onBothRangeInput } = useExtendedMintActionHandlers(undefined)
  const { leftRangeTypedValue, rightRangeTypedValue } = useExtendedFormState()
  const [minPrice, maxPrice] = useMemo(() => {
    const { minPrice: rawMinPrice, maxPrice: rawMaxPrice } = query

    return [rawMinPrice, rawMaxPrice].map((p) => {
      if (typeof p === 'string' && !Number.isNaN(p)) return p
      return undefined
    })
  }, [query])

  useEffect(() => {
    if (!leftRangeTypedValue && !rightRangeTypedValue && minPrice && maxPrice) {
      onBothRangeInput({
        leftTypedValue: tryParsePrice(baseToken, quoteToken, minPrice),
        rightTypedValue: tryParsePrice(baseToken, quoteToken, maxPrice),
      })
    }
  }, [query, minPrice, maxPrice, baseToken, quoteToken, leftRangeTypedValue, rightRangeTypedValue, onBothRangeInput])
}
