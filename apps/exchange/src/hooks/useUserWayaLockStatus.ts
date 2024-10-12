import { ChainId } from '@plexswap/chains'
import { useQuery } from '@tanstack/react-query'
import { useWayaVaultContract } from 'hooks/useContract'
import { useAccount } from 'wagmi'
import { useActiveChainId } from './useActiveChainId'

export const useUserWayaLockStatus = () => {
  const { address: account } = useAccount()
  const { chainId } = useActiveChainId()
  const wayaVaultContract = useWayaVaultContract()

  const { data: userWayaLockStatus = null } = useQuery({
    queryKey: ['userWayaLockStatus', account],

    queryFn: async () => {
      if (!account) return undefined
      const [, , , , , lockEndTime, , locked] = await wayaVaultContract.read.userInfo([account])
      const lockEndTimeStr = lockEndTime.toString()
      return locked && (lockEndTimeStr === '0' || Date.now() > parseInt(lockEndTimeStr) * 1000)
    },

    enabled: Boolean(account && chainId === ChainId.BSC),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  return userWayaLockStatus
}
