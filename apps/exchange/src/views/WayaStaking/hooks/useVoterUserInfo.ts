import { ChainId } from '@plexswap/chains'
import { useReadContract } from '@plexswap/wagmi'
import dayjs from 'dayjs'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useVoterContract } from 'hooks/useContract'
import { useMemo } from 'react'
import { Address } from 'viem'
import { WayaLockStatus, WayaPoolType } from '../types'
import { useCheckIsUserAllowMigrate } from './useCheckIsUserAllowMigrate'
import { useCurrentBlockTimestamp } from './useCurrentBlockTimestamp'
import { useWayaPoolLockInfo } from './useWayaPoolLockInfo'

export enum WayaPoolLockStatus {
  LOCKING = 0,
  WITHDRAW = 1,
}

export type VoterUserInfo = {
  // waya amount locked by user
  amount: bigint
  // end time of user lock
  end: bigint
  // lock through waya pool proxy
  // will zeroAddress if not locked through waya pool proxy
  wayaPoolProxy: Address
  // waya amount locked by waya pool proxy
  wayaAmount: bigint
  // lock end time of waya pool proxy
  lockEndTime: number
  // migration time of waya pool proxy
  migrationTime: number
  // waya pool type of waya pool proxy
  // 1: Migration
  // 2: Delegation
  wayaPoolType: WayaPoolType
  // withdraw flag of waya pool proxy
  // 0: not withdraw
  // 1: already withdraw
  withdrawFlag: WayaPoolLockStatus
}

export const useVoterUserInfo = (
  targetChain?: ChainId,
): {
  data?: VoterUserInfo
  refetch: () => void
} => {
  const voterContract = useVoterContract(targetChain)
  const { account } = useAccountActiveChain()

  const { data, refetch } = useReadContract({
    chainId: targetChain ?? voterContract?.chain?.id,
    abi: voterContract.abi,
    address: voterContract.address,
    functionName: 'getUserInfo',
    query: {
      enabled: Boolean(voterContract?.address && account),
      select: (d) => {
        if (!d) return undefined
        const [amount, end, wayaPoolProxy, wayaAmount, lockEndTime, migrationTime, wayaPoolType, withdrawFlag] = d
        return {
          amount,
          end,
          wayaPoolProxy,
          wayaAmount,
          lockEndTime,
          migrationTime,
          wayaPoolType,
          withdrawFlag,
        } as VoterUserInfo
      },
    },
    args: [account!],
    watch: true,
  })

  return {
    data,
    refetch,
  }
}

export const useWayaLockStatus = (
  targetChain?: ChainId,
): {
  status: WayaLockStatus
  shouldMigrate: boolean
  wayaLockedAmount: bigint
  nativeWayaLockedAmount: bigint
  proxyWayaLockedAmount: bigint
  wayaLocked: boolean
  wayaLockExpired: boolean
  wayaPoolLocked: boolean
  wayaPoolLockExpired: boolean
  wayaUnlockTime: number
  wayaPoolUnlockTime: number
  delegated: boolean
} => {
  const currentTimestamp = useCurrentBlockTimestamp()
  const { data: userInfo } = useVoterUserInfo(targetChain)
  // if user locked at wayaPool before, should migrate
  const wayaPoolLockInfo = useWayaPoolLockInfo(targetChain)

  const isAllowMigrate = useCheckIsUserAllowMigrate(String(wayaPoolLockInfo.lockEndTime))

  const shouldMigrate = useMemo(() => {
    return wayaPoolLockInfo?.locked && userInfo?.wayaPoolType !== WayaPoolType.MIGRATED && isAllowMigrate
  }, [wayaPoolLockInfo?.locked, isAllowMigrate, userInfo?.wayaPoolType])

  const delegateOnly = useMemo(() => {
    if (!userInfo) return false

    return userInfo.wayaPoolType === WayaPoolType.DELEGATED && userInfo.amount === 0n
  }, [userInfo])

  const now = useMemo(() => dayjs.unix(currentTimestamp), [currentTimestamp])

  const wayaLocked = useMemo(() => Boolean(userInfo && userInfo.amount > 0n), [userInfo])

  const wayaUnlockTime = useMemo(() => {
    if (!userInfo) return 0
    return Number(userInfo.end)
  }, [userInfo])

  const wayaLockExpired = useMemo(() => {
    if (!wayaLocked) return false
    return dayjs.unix(wayaUnlockTime).isBefore(now)
  }, [wayaLocked, wayaUnlockTime, now])

  const delegated = useMemo(() => userInfo?.wayaPoolType === WayaPoolType.DELEGATED, [userInfo])

  const wayaPoolLocked = useMemo(
    () => !delegated && Boolean(userInfo?.wayaAmount) && userInfo?.withdrawFlag !== WayaPoolLockStatus.WITHDRAW,
    [delegated, userInfo?.wayaAmount, userInfo?.withdrawFlag],
  )

  const wayaPoolLockExpired = useMemo(() => {
    if (!wayaPoolLocked) return false
    return currentTimestamp > userInfo!.lockEndTime
  }, [wayaPoolLocked, currentTimestamp, userInfo])

  const nativeWayaLockedAmount = useMemo(() => {
    if (!userInfo) return BigInt(0)
    return userInfo.amount ?? 0n
  }, [userInfo])

  const proxyWayaLockedAmount = useMemo(() => {
    if (!wayaPoolLocked || delegated) return 0n

    return userInfo?.wayaAmount ?? 0n
  }, [wayaPoolLocked, delegated, userInfo?.wayaAmount])

  const wayaLockedAmount = useMemo(() => {
    return nativeWayaLockedAmount + proxyWayaLockedAmount
  }, [nativeWayaLockedAmount, proxyWayaLockedAmount])

  const wayaPoolUnlockTime = useMemo(() => {
    if (!wayaPoolLocked) return 0
    return Number(userInfo!.lockEndTime)
  }, [userInfo, wayaPoolLocked])

  const status = useMemo(() => {
    if (((!userInfo || !userInfo.amount) && !wayaPoolLocked && !shouldMigrate) || delegateOnly)
      return WayaLockStatus.NotLocked
    if (wayaLockExpired) return WayaLockStatus.Expired
    if ((userInfo?.amount && userInfo.end) || wayaPoolLocked) return WayaLockStatus.Locking
    if (shouldMigrate) return WayaLockStatus.Migrate
    return WayaLockStatus.NotLocked
  }, [userInfo, wayaPoolLocked, shouldMigrate, delegateOnly, wayaLockExpired])

  return {
    status,
    shouldMigrate,
    wayaLockedAmount,
    nativeWayaLockedAmount,
    proxyWayaLockedAmount,
    delegated,
    wayaLocked,
    wayaLockExpired,
    wayaPoolLocked,
    wayaPoolLockExpired,
    wayaUnlockTime,
    wayaPoolUnlockTime,
  }
}
