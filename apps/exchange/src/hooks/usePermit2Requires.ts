import { CurrencyAmount, Token } from '@plexswap/sdk-core'
import { bscTestnetTokens, plexchainTokens  } from '@plexswap/tokens'
import { useMemo } from 'react'
import { Address, isAddressEqual } from 'viem'
import useAccountActiveChain from './useAccountActiveChain'
import useCurrentBlockTimestamp from './useCurrentBlockTimestamp'
import { usePermit2Allowance } from './usePermit2Allowance'
import { usePermit2Details } from './usePermit2Details'

const EXPIRES_BUFFER = 60n * 15n // 15 minutes in seconds

export const usePermit2Requires = (amount: CurrencyAmount<Token> | undefined, spender?: Address) => {
  const { account } = useAccountActiveChain()
  const { allowance, refetch } = usePermit2Allowance(account, amount?.currency)
  const { data } = usePermit2Details(account, amount?.currency, spender)
  const { amount: permitAmount, expiration = 0n } = data ?? {}
  const now = useCurrentBlockTimestamp() ?? 0n

  const requireRevoke = useMemo((): boolean => {
    const isPlexchainUSDP =
      amount?.currency?.chainId === plexchainTokens.usdp.chainId  &&
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

  const requirePermit = useMemo((): boolean => {
    if (!amount) return false

    return permitAmount?.lessThan(amount) || (Boolean(expiration) && BigInt(expiration) - now < EXPIRES_BUFFER)
  }, [amount, permitAmount, expiration, now])

  return {
    requireApprove,
    requireRevoke,
    requirePermit,
    allowance,
    refetch,
  }
}
