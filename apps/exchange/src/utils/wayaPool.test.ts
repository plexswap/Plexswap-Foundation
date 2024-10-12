import { BOOST_WEIGHT, DURATION_FACTOR, MAX_LOCK_DURATION, UNLOCK_FREE_DURATION } from '@plexswap/pools'
import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { describe, it, vi } from 'vitest'
import { getWayaVaultContract } from './contractHelpers'
import { VaultPosition, getVaultPosition } from './wayaPool'

describe.concurrent('wayaPool', () => {
  it.each([
    ['BOOST_WEIGHT', BOOST_WEIGHT],
    ['UNLOCK_FREE_DURATION', BigInt(UNLOCK_FREE_DURATION)],
    ['DURATION_FACTOR', DURATION_FACTOR],
    ['MAX_LOCK_DURATION', BigInt(MAX_LOCK_DURATION)],
  ])('%s should be equal to SC: %s', async (method, result) => {
    const wayaVault = getWayaVaultContract()
    const got = await wayaVault.read[method]()
    expect(got).toBe(result)
  })
  const NOW = dayjs('2022-01-01')

  it.each([
    // None
    [{}, VaultPosition.None],
    [{ userShares: undefined }, VaultPosition.None],
    [{ userShares: undefined, lockEndTime: '0', locked: true }, VaultPosition.None],
    [{ userShares: new BigNumber('0') }, VaultPosition.None],
    // Flexible
    [{ userShares: new BigNumber('1') }, VaultPosition.Flexible],
    [{ userShares: new BigNumber('1'), locked: false }, VaultPosition.Flexible],
    [{ userShares: new BigNumber('1'), locked: false, lockEndTime: `${NOW.valueOf() - 1000}` }, VaultPosition.Flexible],
    // Locked
    [{ userShares: new BigNumber('1'), locked: true }, VaultPosition.Locked],
    [
      {
        userShares: new BigNumber('1'),
        locked: true,
        lockEndTime: NOW.add(1, 'days').unix().toString(),
      },
      VaultPosition.Locked,
    ],
    // LockedEnd
    [
      {
        userShares: new BigNumber('1'),
        locked: true,
        lockEndTime: NOW.subtract(1, 'days').unix().toString(),
      },
      VaultPosition.LockedEnd,
    ],
    // after burning
    [
      {
        userShares: new BigNumber('1'),
        locked: true,
        lockEndTime: NOW.subtract(8, 'days').unix().toString(),
      },
      VaultPosition.AfterBurning,
    ],
  ])(`%s should be %s`, (params, result) => {
    vi.useFakeTimers().setSystemTime(NOW.valueOf())
    expect(getVaultPosition(params)).toBe(result)
  })

  it('should be not be Locked if lockEndTime after now ', () => {
    vi.useFakeTimers().setSystemTime(NOW.valueOf())
    expect(
      getVaultPosition({
        userShares: new BigNumber('1'),
        locked: true,
        lockEndTime: NOW.subtract(1, 'days').unix().toString(),
      }),
    ).not.toBe(VaultPosition.Locked)
  })
})