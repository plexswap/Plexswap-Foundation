import { FarmWithStakedValue } from '@plexswap/farms'
import { createContext } from 'react'
import type { GlobalFarmWithStakeValue } from './FarmsExtended'

export const FarmsContext = createContext<{ chosenFarmsMemoized: FarmWithStakedValue[] }>({
  chosenFarmsMemoized: [],
})

export const FarmsExtendedContext = createContext<{
  chosenFarmsMemoized: GlobalFarmWithStakeValue[]
  farmsAvgInfo: { [p: string]: { volumeUSD: number; tvlUSD: number; feeUSD: number; apr: number } } | undefined
}>({
  chosenFarmsMemoized: [],
  farmsAvgInfo: undefined,
})
