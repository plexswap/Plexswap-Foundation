import { getFullDecimalMultiplier } from '@plexswap/utils/getFullDecimalMultiplier'
import BigNumber from 'bignumber.js'
import { DEFAULT_TOKEN_DECIMAL } from 'config'
import { useCropChief } from 'hooks/useContract'
import { useCallback } from 'react'

const options = {}

const poolStake = async (cropChiefContract, amount, decimals = 18) => {
  return cropChiefContract.write.deposit([new BigNumber(amount).times(getFullDecimalMultiplier(decimals)).toString()], {
    ...options,
  })
}

const poolStakeBnb = async (cropChiefContract, amount) => {
  return cropChiefContract.write.deposit([new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()], {
    ...options,
  })
}

const useStakePool = (poolId: number, isUsingBnb = false) => {
  const cropChiefContract = useCropChief(poolId)

  const handleStake = useCallback(
    async (amount: string, decimals: number) => {
      if (isUsingBnb) {
        return poolStakeBnb(cropChiefContract, amount)
      }
      return poolStake(cropChiefContract, amount, decimals)
    },
    [isUsingBnb, cropChiefContract],
  )

  return { onStake: handleStake }
}

export default useStakePool
