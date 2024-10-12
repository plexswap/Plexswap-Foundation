import { BOOSTED_FARM_EXTENDED_GAS_LIMIT } from 'config'
import { useCallWithGasPrice } from 'hooks/useCallWithGasPrice'
import useCatchTxError from 'hooks/useCatchTxError'
import { useChieffarmerExtended } from 'hooks/useContract'
import { useCallback } from 'react'

export const useUpdateLiquidity = (tokenId: string, onDone: () => void) => {
  const chiefFarmerExtended = useChieffarmerExtended()
  const { fetchWithCatchTxError, loading: isConfirming } = useCatchTxError()
  const { callWithGasPrice } = useCallWithGasPrice()

  const updateLiquidity = useCallback(async () => {
    const receipt = await fetchWithCatchTxError(() => {
      return callWithGasPrice(chiefFarmerExtended, 'updateLiquidity', [BigInt(tokenId)], { gas: BOOSTED_FARM_EXTENDED_GAS_LIMIT })
    })

    if (receipt?.status && onDone) {
      onDone()
    }
  }, [tokenId, chiefFarmerExtended, callWithGasPrice, fetchWithCatchTxError, onDone])

  return { updateLiquidity, isConfirming }
}
