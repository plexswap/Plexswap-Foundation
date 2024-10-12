import { useChieffarmer, useSpecialWayaWrapperContract } from 'hooks/useContract'
import { useCallback } from 'react'
import { useGasPrice } from 'state/user/hooks'
import { harvestFarm, wayaHarvestFarm } from 'utils/calls'
import { Address } from 'viem'

const useHarvestFarm = (farmPid: number) => {
  const chiefFarmerContract = useChieffarmer()
  const gasPrice = useGasPrice()

  const handleHarvest = useCallback(async () => {
    return harvestFarm(chiefFarmerContract, farmPid, gasPrice)
  }, [farmPid, chiefFarmerContract, gasPrice])

  return { onReward: handleHarvest }
}

export const useWayaHarvestFarm = (wayaWrapperAddress: Address) => {
  const SpecialWayaContract = useSpecialWayaWrapperContract(wayaWrapperAddress)
  const gasPrice = useGasPrice()

  const handleHarvest = useCallback(async () => {
    return wayaHarvestFarm(SpecialWayaContract, gasPrice)
  }, [SpecialWayaContract, gasPrice])

  return { onReward: handleHarvest }
}

export default useHarvestFarm