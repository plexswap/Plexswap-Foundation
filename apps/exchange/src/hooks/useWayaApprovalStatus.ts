import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { Address, erc20Abi } from 'viem'
import { useAccount } from 'wagmi'

import { getWayaContract } from 'utils/contractHelpers'

import { useReadContract } from '@plexswap/wagmi'
import { useActiveChainId } from './useActiveChainId'

export const useWayaApprovalStatus = (spender: any) => {
  const { address: account } = useAccount()
  const { chainId } = useActiveChainId()
  const wayaContract = useMemo(() => (chainId ? getWayaContract(chainId) : undefined), [chainId])

  const { data, refetch } = useReadContract<typeof erc20Abi, 'allowance', [Address, any]>({
    chainId,
    abi: wayaContract?.abi,
    address: wayaContract?.address,
    query: {
      enabled: Boolean(account && spender),
    },
    functionName: 'allowance',
    args: [account!, spender],
    watch: true,
  })

  return useMemo(
    () => ({
      isVaultApproved: data && data > 0,
      allowance: data ? new BigNumber(data?.toString()) : BIG_ZERO,
      setLastUpdated: refetch,
    }),
    [data, refetch],
  )
}

export default useWayaApprovalStatus
