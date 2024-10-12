import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { useCropChief } from 'hooks/useContract'
import { useCallback } from 'react'

const options = {}

const harvestPool = async (cropChiefContract) => {
  return cropChiefContract.write.deposit(['0'], { ...options })
}

const harvestPoolBnb = async (cropChiefContract) => {
  return cropChiefContract.write.deposit({
    ...options,
    value: BIG_ZERO.toString(),
  })
}

const useHarvestPool = (poolId, isUsingBnb = false) => {
  const cropChiefContract = useCropChief(poolId)

  const handleHarvest = useCallback(async () => {
    if (isUsingBnb) {
      return harvestPoolBnb(cropChiefContract)
    }

    return harvestPool(cropChiefContract)
  }, [isUsingBnb, cropChiefContract])

  return { onReward: handleHarvest }
}

export default useHarvestPool
