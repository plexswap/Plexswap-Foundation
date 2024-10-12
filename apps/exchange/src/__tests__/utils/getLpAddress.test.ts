import { Token } from '@plexswap/sdk-core'
import { ChainId } from '@plexswap/chains'
import {WAYA_BSC, BUSD_BSC} from '@plexswap/tokens'
import getLpAddress from 'utils/getLpAddress'

const WAYA_AS_STRING = WAYA_BSC.address
const BUSD_AS_STRING = BUSD_BSC.address
const WAYA_AS_TOKEN = new Token(ChainId.BSC, WAYA_AS_STRING, 18,"WAYAT")
const BUSD_AS_TOKEN = new Token(ChainId.BSC, BUSD_AS_STRING, 18,"BUSDT")
const WAYA_BUSD_LP = '0x3660F1Ee5711c69160061e55169136631Aa84D6C'

describe('getLpAddress', () => {
  it('returns correct LP address, both tokens are strings', () => {
    expect(getLpAddress(WAYA_AS_STRING, BUSD_AS_STRING)).toBe(WAYA_BUSD_LP)
  })
  it('returns correct LP address, token1 is string, token 2 is Token', () => {
    expect(getLpAddress(WAYA_AS_STRING, BUSD_AS_TOKEN)).toBe(WAYA_BUSD_LP)
  })
  it('returns correct LP address, both tokens are Token', () => {
    expect(getLpAddress(WAYA_AS_TOKEN, BUSD_AS_TOKEN)).toBe(WAYA_BUSD_LP)
  })
  it('returns null if any address is invalid', () => {
    expect(getLpAddress('123', '456')).toBe(null)
    expect(getLpAddress(undefined, undefined)).toBe(null)
    expect(getLpAddress(WAYA_AS_STRING, undefined)).toBe(null)
    expect(getLpAddress(undefined, BUSD_AS_TOKEN)).toBe(null)
    expect(getLpAddress(WAYA_AS_STRING, '456')).toBe(null)
    expect(getLpAddress('123', BUSD_AS_TOKEN)).toBe(null)
  })
})
