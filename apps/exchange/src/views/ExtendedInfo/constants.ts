import { ChainId } from '@plexswap/chains'
import { ManipulateType } from 'dayjs'

export const extendedInfoPath = `info/extended`

//    ***  PLEXSWAP EXTENDED POOL ***

export const POOL_HIDE: { [key: string]: string[] } = {
  // TODO: update to our own
  [ChainId.PLEXCHAIN]: [
    '0x0',
  ],
  [ChainId.BSC]: [
    '0x87196a3BCeC98116307bdc8B887c3074E8b5bc96'
  ],
}

//     ***   MOCK TOKEN  ***
export const TOKEN_HIDE: { [key: string]: string[] } = {
  [ChainId.PLEXCHAIN]: [
    '0x0',
  ],
  [ChainId.BSC]: [
    '0xdb19f2052D2B1aD46Ed98C66336A5dAADEB13005', 
    '0x57a63C32CC2aD6CE4FBE5423d548D12d0EEDdfc1'
  ],
}

export const TimeWindow: {
  [key: string]: ManipulateType
} = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
}

export const ONE_HOUR_SECONDS = 3600
export const ONE_DAY_SECONDS = 86400
export const MAX_UINT128 = 2n ** 128n - 1n

export const SUBGRAPH_START_BLOCK = {
  [ChainId.BSC]: 26956207,
  [ChainId.PLEXCHAIN]: 16950686,

}

export const NODE_REAL_ADDRESS_LIMIT = 50

export const DURATION_INTERVAL = {
  day: ONE_HOUR_SECONDS,
  week: ONE_DAY_SECONDS,
  month: ONE_DAY_SECONDS,
  year: ONE_DAY_SECONDS,
}
