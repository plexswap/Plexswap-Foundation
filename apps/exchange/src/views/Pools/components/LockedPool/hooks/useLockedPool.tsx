import { useTranslation } from '@plexswap/localization'
import { Token } from '@plexswap/sdk-core'
import { useToast } from '@plexswap/ui-plex'
import { getBalanceNumber, getDecimalAmount } from '@plexswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import { ONE_WEEK_DEFAULT, VaultKey } from '@plexswap/pools'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useCatchTxError from 'hooks/useCatchTxError'
import { useVaultPoolContract } from 'hooks/useContract'
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react'
import { useAppDispatch } from 'state'
import { fetchWayaVaultUserData } from 'state/pools'
import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { ToastDescriptionWithTx } from 'components/Toast'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'
import { vaultPoolConfig } from 'config/constants/pools'
import { PrepConfirmArg } from '../types'

interface HookArgs {
  lockedAmount: BigNumber
  stakingToken: Token
  stakingTokenPrice: number
  onDismiss: () => void
  prepConfirmArg: PrepConfirmArg
  defaultDuration?: number
}

interface HookReturn {
  usdValueStaked: number
  duration: number
  setDuration: Dispatch<SetStateAction<number>>
  pendingTx: boolean
  handleConfirmClick: () => Promise<void>
}

export default function useLockedPool(hookArgs: HookArgs): HookReturn {
  const {
    lockedAmount,
    stakingToken,
    stakingTokenPrice,
    onDismiss,
    prepConfirmArg,
    defaultDuration = ONE_WEEK_DEFAULT,
  } = hookArgs

  const dispatch = useAppDispatch()
  const { chainId } = useActiveChainId()

  const { address: account } = useAccount()
  const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError()
  const vaultPoolContract = useVaultPoolContract(VaultKey.WayaVault)
  const { callWithGasPrice } = useCallWithGasPrice()
  const usdValueStaked = useMemo(
    () =>
      getBalanceNumber(
        getDecimalAmount(lockedAmount, stakingToken.decimals).multipliedBy(stakingTokenPrice),
        stakingToken.decimals,
      ),
    [lockedAmount, stakingTokenPrice, stakingToken.decimals],
  )

  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { toastSuccess } = useToast()
  const [duration, setDuration] = useState(() => defaultDuration)

  const handleDeposit = useCallback(
    async (convertedStakeAmount: BigNumber, lockDuration: number) => {
      if (!account || !chainId) return
      const callOptions = {
        gas: vaultPoolConfig[VaultKey.WayaVault].gasLimit,
      }

      const receipt = await fetchWithCatchTxError(() => {
        const methodArgs = [BigInt(convertedStakeAmount.toString()), BigInt(lockDuration)] as const
        return callWithGasPrice(vaultPoolContract, 'deposit', methodArgs, callOptions)
      })

      if (receipt?.status) {
        toastSuccess(
          t('Staked!'),
          <ToastDescriptionWithTx txHash={receipt.transactionHash}>
            {t('Your funds have been staked in the pool')}
          </ToastDescriptionWithTx>,
        )
        onDismiss?.()
        dispatch(fetchWayaVaultUserData({ account, chainId }))
        queryClient.invalidateQueries({
          queryKey: ['userWayaLockStatus', account],
        })
      }
    },
    [
      fetchWithCatchTxError,
      toastSuccess,
      dispatch,
      onDismiss,
      account,
      vaultPoolContract,
      t,
      callWithGasPrice,
      queryClient,
      chainId,
    ],
  )

  const handleConfirmClick = useCallback(async () => {
    const { finalLockedAmount = lockedAmount, finalDuration = duration } =
      typeof prepConfirmArg === 'function' ? prepConfirmArg({ duration }) : {}

    const convertedStakeAmount: BigNumber = getDecimalAmount(new BigNumber(finalLockedAmount), stakingToken.decimals)

    handleDeposit(convertedStakeAmount, finalDuration)
  }, [prepConfirmArg, stakingToken, handleDeposit, duration, lockedAmount])

  return { usdValueStaked, duration, setDuration, pendingTx, handleConfirmClick }
}
