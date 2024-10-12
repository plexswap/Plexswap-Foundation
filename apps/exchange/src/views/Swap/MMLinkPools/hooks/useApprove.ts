import { CurrencyAmount, Token } from '@plexswap/sdk-core'
import { bscTestnetTokens, plexchainTokens } from '@plexswap/tokens'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useApproveCallback } from 'hooks/useApproveCallback'
import useTokenAllowance from 'hooks/useTokenAllowance'
import { useMemo, useState } from 'react'
import { Address, isAddressEqual } from 'viem'

export const useApproveRequires = (amount: CurrencyAmount<Token> | undefined, spender?: Address) => {
  const { account } = useAccountActiveChain()
  const { allowance, refetch } = useTokenAllowance(amount?.currency, account, spender)

  const requireRevoke = useMemo((): boolean => {
    const isPlexchainUSDP =
      amount?.currency?.chainId === plexchainTokens.usdp.chainId &&
      isAddressEqual(amount.currency.address, plexchainTokens.usdp.address)

    const isBSCTestNetBUSD =
      amount?.currency?.chainId === bscTestnetTokens.busd.chainId &&
      isAddressEqual(amount.currency.address, bscTestnetTokens.busd.address)

    if (!isPlexchainUSDP && !isBSCTestNetBUSD ) return false

    return !!allowance && allowance.greaterThan(0) && allowance.lessThan(amount)
  }, [allowance, amount])

  const requireApprove = useMemo((): boolean => {
    return !!amount && !!allowance && allowance.lessThan(amount)
  }, [allowance, amount])

  return {
    requireApprove,
    requireRevoke,
    allowance,
    refetch,
  }
}

export const useApprove = (amount: CurrencyAmount<Token> | undefined, spender: Address | undefined) => {
  const { requireApprove, requireRevoke, allowance, refetch } = useApproveRequires(amount, spender)
  const { revokeNoCheck, approveNoCheck } = useApproveCallback(amount, spender)

  const [isRevoking, setIsRevoking] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  const approve = async () => {
    setIsApproving(true)
    try {
      const result = await approveNoCheck()
      setIsApproving(false)
      return result
    } catch (error) {
      setIsApproving(false)
      throw error
    }
  }

  const revoke = async () => {
    setIsRevoking(true)
    try {
      const result = await revokeNoCheck()
      setIsRevoking(false)
      return result
    } catch (error) {
      setIsRevoking(false)
      throw error
    }
  }

  return {
    allowance,

    requireApprove,
    requireRevoke,

    isApproving,
    isRevoking,

    refetch,
    approve,
    revoke,
  }
}
