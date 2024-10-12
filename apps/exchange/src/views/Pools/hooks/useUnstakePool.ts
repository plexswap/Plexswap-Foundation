import { useCropChief } from 'hooks/useContract'
import { useCallback } from 'react'
import { parseUnits } from 'viem'

const options = {}

const poolUnstake = (cropChiefContract: any, amount: string, decimals: number) => {
  const units = parseUnits(amount as `${number}`, decimals)

  return cropChiefContract.write.withdraw([units.toString()], {
    ...options,
  })
}

const poolEmergencyUnstake = (cropChiefContract: any) => {
  return cropChiefContract.emergencyWithdraw({ ...options })
}

const useUnstakePool = (poolId: number, enableEmergencyWithdraw = false) => {
  const cropChiefContract = useCropChief(poolId)

  const handleUnstake = useCallback(
    async (amount: string, decimals: number) => {
      if (enableEmergencyWithdraw) {
        return poolEmergencyUnstake(cropChiefContract)
      }

      return poolUnstake(cropChiefContract, amount, decimals)
    },
    [enableEmergencyWithdraw, cropChiefContract],
  )

  return { onUnstake: handleUnstake }
}

export default useUnstakePool
