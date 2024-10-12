import { BOOSTED_FARM_EXTENDED_GAS_LIMIT } from 'config'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useChieffarmer, useSpecialVault, useSpecialWayaWrapperContract } from 'hooks/useContract'
import { useCallback } from 'react'
import { useFeeDataWithGasPrice } from 'state/user/hooks'
import { specialUnstakeFarm, unstakeFarm, wayaUnStakeFarm } from 'utils/calls'
import { useOraclePrice } from 'views/Farms/hooks/useFetchOraclePrice'

const useUnstakeFarms = (pid?: number, vaultPid?: number) => {
  const { account, chainId } = useAccountActiveChain()
  const { gasPrice } = useFeeDataWithGasPrice()
  const oraclePrice = useOraclePrice(chainId ?? 0)
  const chiefFarmerContract = useChieffarmer()
  const specialVaultContract = useSpecialVault()

  const handleUnstake = useCallback(
    async (amount: string) => {
      return unstakeFarm(chiefFarmerContract, pid, amount, gasPrice)
    },
    [chiefFarmerContract, pid, gasPrice],
  )

  const handleUnstakeSpecial = useCallback(
    async (amount: string) => {
      return specialUnstakeFarm(specialVaultContract, vaultPid, amount, gasPrice, account, oraclePrice, chainId)
    },
    [specialVaultContract, vaultPid, gasPrice, account, oraclePrice, chainId],
  )

  return { onUnstake: vaultPid ? handleUnstakeSpecial : handleUnstake }
}

export const useWayaUnstakeFarms = (wayaWrapperAddress) => {
  const { gasPrice } = useFeeDataWithGasPrice()
  const SpecialWayaContract = useSpecialWayaWrapperContract(wayaWrapperAddress)

  const handleUnstake = useCallback(
    async (amount: string) => {
      return wayaUnStakeFarm(SpecialWayaContract, amount, gasPrice, BOOSTED_FARM_EXTENDED_GAS_LIMIT)
    },
    [SpecialWayaContract, gasPrice],
  )

  return { onUnstake: handleUnstake }
}

export default useUnstakeFarms