import { getBalanceNumber } from '@plexswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useFarmBoosterProxyContractAddress } from 'hooks/useFarmBoosterProxyContractAddress'
import { getWayaContract } from 'utils/contractHelpers'
import { useReadContract } from 'wagmi'

const useProxyWayaBalance = () => {
  const { account, chainId } = useAccountActiveChain()
  const { proxyAddress } = useFarmBoosterProxyContractAddress(account, chainId)
  const wayaContract = getWayaContract()

  const { data, refetch } = useReadContract({
    chainId,
    address: wayaContract.address,
    abi: wayaContract.abi,
    query: {
      enabled: Boolean(account && proxyAddress),
    },
    functionName: 'balanceOf',
    args: [proxyAddress],
  })

  return {
    refreshProxyWayaBalance: refetch,
    proxyWayaBalance: data ? getBalanceNumber(new BigNumber(data.toString())) : 0,
  }
}

export default useProxyWayaBalance
