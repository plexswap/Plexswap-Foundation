import { BOOSTED_FARM_EXTENDED_GAS_LIMIT } from 'config'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'
import useCatchTxError from 'hooks/useCatchTxError'
import { useFarmBoosterExtendedContract } from 'hooks/useContract'
import { useCallback } from 'react'

export const useBoosterFarmExtendedHandlers = (tokenId: string, onDone: () => void) => {
  const farmBoosterExtendedContract = useFarmBoosterExtendedContract()
  const { fetchWithCatchTxError, loading: isConfirming } = useCatchTxError()
  const { callWithGasPrice } = useCallWithGasPrice()

  const activate = useCallback(async () => {
    const receipt = await fetchWithCatchTxError(() => {
      return callWithGasPrice(farmBoosterExtendedContract, 'activate', [BigInt(tokenId)], { gas: BOOSTED_FARM_EXTENDED_GAS_LIMIT })
    })

    if (receipt?.status && onDone) {
      onDone()
    }
  }, [tokenId, farmBoosterExtendedContract, callWithGasPrice, fetchWithCatchTxError, onDone])

  const deactivate = useCallback(async () => {
    const receipt = await fetchWithCatchTxError(() => {
      return callWithGasPrice(farmBoosterExtendedContract, 'deactive', [BigInt(tokenId)], { gas: BOOSTED_FARM_EXTENDED_GAS_LIMIT })
    })

    if (receipt?.status && onDone) {
      onDone()
    }
  }, [tokenId, farmBoosterExtendedContract, callWithGasPrice, fetchWithCatchTxError, onDone])

  return { activate, deactivate, isConfirming }
}
