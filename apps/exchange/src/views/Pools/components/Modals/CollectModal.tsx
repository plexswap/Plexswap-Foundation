import { useTranslation } from '@plexswap/localization'
import { useToast } from '@plexswap/ui-plex'
import { PoolWidget as Pool } from "@plexswap/widgets-internal"
import { useCallback } from 'react'
import { ToastDescriptionWithTx } from 'components/Toast'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useCatchTxError from 'hooks/useCatchTxError'
import { useAppDispatch } from 'state'
import { updateUserBalance, updateUserPendingReward, updateUserStakedBalance } from 'state/pools'
import { useAccount } from 'wagmi'

import useHarvestPool from '../../hooks/useHarvestPool'

export const CollectModalContainer = ({
  earningTokenSymbol,
  poolId,
  isBnbPool,
  onDismiss,
  ...rest
}: React.PropsWithChildren<Pool.CollectModalProps>) => {
  const { t } = useTranslation()
  const { chainId } = useActiveChainId()
  const { toastSuccess } = useToast()
  const { address: account } = useAccount()
  const dispatch = useAppDispatch()
  const { fetchWithCatchTxError, loading: pendingTx } = useCatchTxError()
  const { onReward } = useHarvestPool(poolId, isBnbPool)

  const handleHarvestConfirm = useCallback(async () => {
    const receipt = await fetchWithCatchTxError(() => {
      return onReward()
    })
    if (receipt?.status) {
      toastSuccess(
        `${t('Harvested')}!`,
        <ToastDescriptionWithTx txHash={receipt.transactionHash}>
          {t('Your %symbol% earnings have been sent to your wallet!', { symbol: earningTokenSymbol })}
        </ToastDescriptionWithTx>,
      )
      if (account && chainId) {
        dispatch(updateUserStakedBalance({ poolId, account, chainId }))
        dispatch(updateUserPendingReward({ poolId, account, chainId }))
        dispatch(updateUserBalance({ poolId, account, chainId }))
      }
      onDismiss?.()
    }
  }, [
    account,
    dispatch,
    earningTokenSymbol,
    fetchWithCatchTxError,
    onDismiss,
    onReward,
    poolId,
    t,
    toastSuccess,
    chainId,
  ])

  return (
    <Pool.CollectModal
      earningTokenSymbol={earningTokenSymbol}
      onDismiss={onDismiss}
      handleHarvestConfirm={handleHarvestConfirm}
      pendingTx={pendingTx}
      {...rest}
    />
  )
}

export default CollectModalContainer