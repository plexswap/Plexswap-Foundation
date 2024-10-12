import { useQuery } from '@tanstack/react-query'
import { useFarmBoosterContract } from 'hooks/useContract'
import { Address } from 'viem'

export const useUserBoosterStatus = (account?: Address) => {
  const farmBoosterContract = useFarmBoosterContract()
  const { data: maxBoostedFarms, status: maxBoostStatus } = useQuery({
    queryKey: ['maxBoostFarm'],
    queryFn: () => farmBoosterContract.read.maxBoostedFarms(),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })
  const {
    data: activatedPools,
    status,
    refetch,
  } = useQuery({
    queryKey: ['activatedBoostFarm', [account]],
    queryFn: () => farmBoosterContract.read.activedPools([account!]),
    enabled: Boolean(account),
  })

  return {
    maxBoostCounts: maxBoostedFarms ? Number(maxBoostedFarms) : 0,
    activatedPoolsCounts: activatedPools?.length ?? 0,
    remainingCounts: (maxBoostedFarms ? Number(maxBoostedFarms) : 0) - (activatedPools?.length ?? 0),
    isLoading: maxBoostStatus !== 'success' || status !== 'success',
    refreshActivePools: refetch,
  }
}
