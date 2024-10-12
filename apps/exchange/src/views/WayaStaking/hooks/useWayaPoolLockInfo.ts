import { ChainId } from '@plexswap/chains'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useWayaVaultContract } from 'hooks/useContract'
import { useCurrentBlockTimestamp } from './useCurrentBlockTimestamp'

export type WayaPoolInfo = {
  shares: bigint
  lastDepositedTime: bigint
  wayaAtLastUserAction: bigint
  lastUserActionTime: bigint
  lockStartTime: bigint
  lockEndTime: bigint
  userBoostedShare: bigint
  locked: boolean
  lockedAmount: bigint
}

export const useWayaPoolLockInfo = (targetChain?: ChainId) => {
  const { chainId, account } = useAccountActiveChain()
  const wayaVaultContract = useWayaVaultContract(targetChain)
  const currentTimestamp = useCurrentBlockTimestamp()
  const chainIdTarget = targetChain || chainId

  const { data: info } = useQuery({
    queryKey: ['wayaPoolLockInfo', wayaVaultContract.address, chainIdTarget, account],

    queryFn: async (): Promise<WayaPoolInfo> => {
      if (!account) return {} as WayaPoolInfo
      const [
        shares,
        lastDepositedTime,
        wayaAtLastUserAction,
        lastUserActionTime,
        lockStartTime,
        lockEndTime,
        userBoostedShare,
        _locked,
        lockedAmount,
      ] = await wayaVaultContract.read.userInfo([account])
      const lockEndTimeStr = lockEndTime.toString()
      return {
        shares,
        lastDepositedTime,
        wayaAtLastUserAction,
        lastUserActionTime,
        lockStartTime,
        lockEndTime,
        userBoostedShare,
        locked:
          _locked &&
          lockEndTimeStr !== '0' &&
          dayjs.unix(parseInt(lockEndTimeStr, 10)).isAfter(dayjs.unix(currentTimestamp)),
        lockedAmount,
      }
    },

    enabled: Boolean(account) && (chainId === ChainId.BSC || chainId === ChainId.BSC_TESTNET),
  })
  return info || ({} as WayaPoolInfo)
}
