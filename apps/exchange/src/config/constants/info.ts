export const MINIMUM_SEARCH_CHARACTERS = 2

export const WEEKS_IN_YEAR = 52.1429

export const TOTAL_FEE = 0.0025
export const LP_HOLDERS_FEE = 0.0017
export const TREASURY_FEE = 0.000225
export const BUYBACK_FEE = 0.000575

export const PCS_V2_START = 1619136000 // April 23, 2021, 12:00:00 AM
export const ONE_DAY_UNIX = 86400 // 24h * 60m * 60s
export const ONE_HOUR_SECONDS = 3600

export const ITEMS_PER_INFO_TABLE_PAGE = 10

export const BSC_TOKEN_WHITELIST = []
// These tokens are either incorrectly priced or have some other issues that spoil the query data
// None of them present any interest as they have almost 0 daily trade volume
export const TOKEN_BLACKLIST = [
  '0xF1D50dB2C40b63D2c598e2A808d1871a40b1E653',
  '0x4269e4090ff9dfc99d8846eb0d42e67f01c3ac8b',
]

export const PLEX_TOKEN_BLACKLIST = []
export const PLEX_TOKEN_WHITELIST = ['0x32d9F70F6eF86718A51021ad269522Abf4CFFE49',]
