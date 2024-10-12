import { useTranslation } from '@plexswap/localization'
import { useToast } from '@plexswap/ui-plex'
import { ToastDescriptionWithTx } from 'components/Toast'
import { BOOSTED_FARM_EXTENDED_GAS_LIMIT } from 'config'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useSpecialWayaWrapperContract } from 'hooks/useContract'
import { useCallback } from 'react'
import { useAppDispatch } from 'state'
import { fetchWayaWrapperUserDataAsync } from 'state/farms'
import { useFeeDataWithGasPrice } from 'state/user/hooks'
import { wayaStakeFarm } from 'utils/calls'
import { Address } from 'viem'

import useCatchTxError from 'hooks/useCatchTxError'

export const useUpdateWayaFarms = (wayaWrapperAddress: Address, pid: number) => {
  const { gasPrice } = useFeeDataWithGasPrice()
  const { fetchWithCatchTxError } = useCatchTxError()
  const { toastSuccess } = useToast()
  const SpecialWayaContract = useSpecialWayaWrapperContract(wayaWrapperAddress)
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { account, chainId } = useAccountActiveChain()

  const onDone = useCallback(() => {
    if (account && chainId) {
      dispatch(fetchWayaWrapperUserDataAsync({ account, pids: [pid], chainId }))
    }
  }, [account, chainId, dispatch, pid])
  const handleStake = useCallback(async () => {
    const noHarvest = true
    const Tx = await wayaStakeFarm(SpecialWayaContract, '0', gasPrice, BOOSTED_FARM_EXTENDED_GAS_LIMIT, noHarvest)
    return Tx
  }, [SpecialWayaContract, gasPrice])

  const updateWayaMultiplier = async () => {
    const receipt = await fetchWithCatchTxError(() => handleStake())
    if (receipt?.status) {
      toastSuccess(
        `${t('Updated')}!`,
        <ToastDescriptionWithTx txHash={receipt.transactionHash}>
          {t('Your waya booster have been updated')}
        </ToastDescriptionWithTx>,
      )
      onDone()
    }
  }

  return { onUpdate: updateWayaMultiplier }
}
