import { useTranslation } from '@plexswap/localization'
import { MaxUint256 } from '@plexswap/sdk-core'
import { useToast } from '@plexswap/ui-plex'
import { VaultKey } from '@plexswap/pools'
import { ToastDescriptionWithTx } from 'components/Toast'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'
import useCatchTxError from 'hooks/useCatchTxError'
import { useERC20, useCropChief, useVaultPoolContract } from 'hooks/useContract'
import useWayaApprovalStatus from 'hooks/useWayaApprovalStatus'
import useWayaApprove from 'hooks/useWayaApprove'
import { useCallback } from 'react'
import { useAppDispatch } from 'state'
import { updateUserAllowance } from 'state/actions'
import { useAccount } from 'wagmi'

export const useApprovePool = (lpContract: ReturnType<typeof useERC20>, poolId, earningTokenSymbol) => {
  const { toastSuccess } = useToast()
  const { chainId } = useActiveChainId()
  const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError()
  const { callWithGasPrice } = useCallWithGasPrice()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { address: account } = useAccount()
  const cropChiefContract = useCropChief(poolId)

  const handleApprove = useCallback(async () => {
    const receipt = await fetchWithCatchTxError(() => {
      return callWithGasPrice(lpContract, 'approve', [cropChiefContract.address, MaxUint256])
    })
    if (receipt?.status) {
      toastSuccess(
        t('Contract Enabled'),
        <ToastDescriptionWithTx txHash={receipt.transactionHash}>
          {t('You can now stake in the %symbol% pool!', { symbol: earningTokenSymbol })}
        </ToastDescriptionWithTx>,
      )
      if (account && chainId) {
        dispatch(updateUserAllowance({ poolId, account, chainId }))
      }
    }
  }, [
    chainId,
    account,
    dispatch,
    lpContract,
    cropChiefContract,
    poolId,
    earningTokenSymbol,
    t,
    toastSuccess,
    callWithGasPrice,
    fetchWithCatchTxError,
  ])

  return { handleApprove, pendingTx }
}

// Approve WAYA auto pool
export const useVaultApprove = (vaultKey: VaultKey | undefined, setLastUpdated: () => void) => {
  const vaultPoolContract = useVaultPoolContract(vaultKey)
  const { t } = useTranslation()

  return useWayaApprove(
    setLastUpdated,
    vaultPoolContract?.address,
    t('You can now stake in the %symbol% vault!', { symbol: 'WAYA' }),
  )
}

export const useCheckVaultApprovalStatus = (vaultKey?: VaultKey) => {
  const vaultPoolContract = useVaultPoolContract(vaultKey)

  return useWayaApprovalStatus(vaultPoolContract?.address)
}