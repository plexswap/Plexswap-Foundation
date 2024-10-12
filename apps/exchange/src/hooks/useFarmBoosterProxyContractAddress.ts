import { wayaSupportedChainId } from '@plexswap/farms'
import { useQuery } from '@tanstack/react-query'
import { NO_PROXY_CONTRACT } from 'config/constants'
import { useFarmBoosterContract } from 'hooks/useContract'
import { Address } from 'viem'

export const useFarmBoosterProxyContractAddress = (account?: Address, chainId?: number) => {
  const farmBoosterContract = useFarmBoosterContract()
  const isSupportedChain = chainId ? wayaSupportedChainId.includes(chainId) : false
  const { data, status, refetch } = useQuery({
    queryKey: ['bProxyAddress', account, chainId],
    queryFn: async () => farmBoosterContract.read.proxyContract([account!]),
    enabled: Boolean(account && isSupportedChain),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })
  const isLoading = isSupportedChain ? status !== 'success' : false

  return {
    proxyAddress: data as Address,
    isLoading,
    proxyCreated: data && data !== NO_PROXY_CONTRACT,
    refreshProxyAddress: refetch,
  }
}
