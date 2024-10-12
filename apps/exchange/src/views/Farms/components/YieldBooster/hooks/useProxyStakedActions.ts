import { BOOSTED_FARM_GAS_LIMIT } from 'config'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useFarmBoosterProxyContract } from 'hooks/useContract'
import { useFarmBoosterProxyContractAddress } from 'hooks/useFarmBoosterProxyContractAddress'
import { useCallback } from 'react'
import { useAppDispatch } from 'state'
import { fetchFarmUserDataAsync } from 'state/farms'
import { useGasPrice } from 'state/user/hooks'
import { ChiefFarmerContractType, harvestFarm, stakeFarm, unstakeFarm } from 'utils/calls/farms'
import { useApproveBoostProxyFarm } from '../../../hooks/useApproveFarm'
import useProxyWayaBalance from './useProxyWayaBalance'

export default function useProxyStakedActions(pid, lpContract) {
  const { account, chainId } = useAccountActiveChain()
  const { proxyAddress } = useFarmBoosterProxyContractAddress(account, chainId)
  const wayaProxy = useFarmBoosterProxyContract(proxyAddress) as unknown as ChiefFarmerContractType
  const dispatch = useAppDispatch()
  const gasPrice = useGasPrice()
  const { proxyWayaBalance, refreshProxyWayaBalance } = useProxyWayaBalance()

  const onDone = useCallback(() => {
    if (!account || !chainId) return
    refreshProxyWayaBalance()
    dispatch(fetchFarmUserDataAsync({ account, pids: [pid], chainId, proxyAddress }))
  }, [account, proxyAddress, chainId, pid, dispatch, refreshProxyWayaBalance])

  const { onApprove } = useApproveBoostProxyFarm(lpContract, proxyAddress)

  const onStake = useCallback(
    (value) => stakeFarm(wayaProxy, pid, value, gasPrice, BOOSTED_FARM_GAS_LIMIT),
    [wayaProxy, pid, gasPrice],
  )

  const onUnstake = useCallback(
    (value) => unstakeFarm(wayaProxy, pid, value, gasPrice, BOOSTED_FARM_GAS_LIMIT),
    [wayaProxy, pid, gasPrice],
  )

  const onReward = useCallback(
    () => harvestFarm(wayaProxy, pid, gasPrice, BOOSTED_FARM_GAS_LIMIT),
    [wayaProxy, pid, gasPrice],
  )

  return {
    onStake,
    onUnstake,
    onReward,
    onApprove,
    onDone,
    proxyWayaBalance,
  }
}
