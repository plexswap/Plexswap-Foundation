import { BOOSTED_FARM_EXTENDED_GAS_LIMIT } from 'config'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useChieffarmer, useSpecialVault, useSpecialWayaWrapperContract } from 'hooks/useContract'
import { useCallback } from 'react'
import { useFeeDataWithGasPrice } from 'state/user/hooks'
import { specialStakeFarm, stakeFarm, wayaStakeFarm } from 'utils/calls'
import { useOraclePrice } from 'views/Farms/hooks/useFetchOraclePrice'

const useStakeFarms = (pid: number, vaultPid?: number) => {
  const { account, chainId } = useAccountActiveChain()
  const { gasPrice } = useFeeDataWithGasPrice()

  const oraclePrice = useOraclePrice(chainId ?? 0)
  const chiefFarmerContract = useChieffarmer()
  const specialVaultContract = useSpecialVault()

  const handleStake = useCallback(
    async (amount: string) => {
      return stakeFarm(chiefFarmerContract, pid, amount, gasPrice)
    },
    [chiefFarmerContract, pid, gasPrice],
  )

  const handleStakeSpecial = useCallback(
    async (amount: string) => {
      return specialStakeFarm(specialVaultContract, vaultPid, amount, gasPrice, account, oraclePrice, chainId)
    },
    [specialVaultContract, vaultPid, gasPrice, account, oraclePrice, chainId],
  )

  return { onStake: vaultPid ? handleStakeSpecial : handleStake }
}

export const useWayaStakeFarms = (wayaWrapperAddress) => {
  const { gasPrice } = useFeeDataWithGasPrice()

  const SpecialWayaContract = useSpecialWayaWrapperContract(wayaWrapperAddress)

  const handleStake = useCallback(
    async (amount: string) => {
      return wayaStakeFarm(SpecialWayaContract, amount, gasPrice, BOOSTED_FARM_EXTENDED_GAS_LIMIT)
    },
    [SpecialWayaContract, gasPrice],
  )

  return { onStake: handleStake }
}

export default useStakeFarms