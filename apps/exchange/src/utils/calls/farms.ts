import BigNumber from 'bignumber.js'
import { BOOSTED_FARM_GAS_LIMIT, DEFAULT_GAS_LIMIT, DEFAULT_TOKEN_DECIMAL } from 'config'
import { getChiefFarmerContract, getSpecialVaultContract, getSpecialWayaWrapperContract } from 'utils/contractHelpers'
import { logGTMClickStakeFarmEvent } from 'utils/customGTMEventTracking'
import { MessageTypes, getSpecialVaultContractFee } from 'views/Farms/hooks/getSpecialVaultFee'

export type ChiefFarmerContractType = ReturnType<typeof getChiefFarmerContract>
type SpecialWayaContractType = ReturnType<typeof getSpecialWayaWrapperContract>

export const stakeFarm = async (
  chiefFarmerContract: ChiefFarmerContractType,
  pid,
  amount,
  gasPrice,
  gasLimit?: bigint,
) => {
  const value = new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()
  logGTMClickStakeFarmEvent()

  if (!chiefFarmerContract?.account) return undefined

  return chiefFarmerContract.write.deposit([pid, BigInt(value)], {
    gas: gasLimit || DEFAULT_GAS_LIMIT,
    gasPrice,
    account: chiefFarmerContract.account ?? '0x',
    chain: chiefFarmerContract.chain,
  })
}

export const wayaStakeFarm = async (
  specialContract: SpecialWayaContractType,
  amount,
  gasPrice,
  gasLimit?: bigint,
  noHarvest?: boolean,
) => {
  const value = new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()
  logGTMClickStakeFarmEvent()
  return specialContract.write.deposit([BigInt(value), noHarvest ?? false], {
    gas: gasLimit || DEFAULT_GAS_LIMIT,
    gasPrice,
    account: specialContract.account ?? '0x',
    chain: specialContract.chain,
  })
}

export const unstakeFarm = async (
  chiefFarmerContract: ChiefFarmerContractType,
  pid,
  amount,
  gasPrice,
  gasLimit?: bigint,
) => {
  const value = new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()

  if (!chiefFarmerContract?.account) return undefined

  return chiefFarmerContract.write.withdraw([pid, BigInt(value)], {
    gas: gasLimit || DEFAULT_GAS_LIMIT,
    gasPrice,
    account: chiefFarmerContract.account ?? '0x',
    chain: chiefFarmerContract.chain,
  })
}

export const wayaUnStakeFarm = async (specialContract: SpecialWayaContractType, amount, gasPrice, gasLimit?: bigint) => {
  const value = new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()
  return specialContract.write.withdraw([BigInt(value), false], {
    gas: gasLimit || DEFAULT_GAS_LIMIT,
    gasPrice,
    account: specialContract.account ?? '0x',
    chain: specialContract.chain,
  })
}

export const harvestFarm = async (chiefFarmerContract: ChiefFarmerContractType, pid, gasPrice, gasLimit?: bigint) => {
  if (!chiefFarmerContract?.account) return undefined

  return chiefFarmerContract.write.deposit([pid, 0n], {
    gas: gasLimit || DEFAULT_GAS_LIMIT,
    gasPrice,
    account: chiefFarmerContract.account ?? '0x',
    chain: chiefFarmerContract.chain,
  })
}

export const wayaHarvestFarm = async (specialContract: SpecialWayaContractType, gasPrice, gasLimit?: bigint) => {
  return specialContract.write.deposit([0n, false], {
    gas: gasLimit || BOOSTED_FARM_GAS_LIMIT,
    gasPrice,
    account: specialContract.account ?? '0x',
    chain: specialContract.chain,
  })
}

export const specialStakeFarm = async (
  contract: ReturnType<typeof getSpecialVaultContract>,
  pid,
  amount,
  gasPrice,
  account,
  oraclePrice,
  chainId,
) => {
  if (!contract.account) return undefined

  const value = new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()
  const totalFee = await getSpecialVaultContractFee({
    pid,
    chainId,
    gasPrice,
    oraclePrice,
    amount: value,
    userAddress: account,
    messageType: MessageTypes.Deposit,
  })
  console.info(totalFee, 'stake totalFee')
  logGTMClickStakeFarmEvent()
  return contract.write.deposit([pid, BigInt(value)], {
    value: BigInt(totalFee),
    account: contract.account ?? '0x',
    chain: contract.chain,
  })
}

export const specialUnstakeFarm = async (
  contract: ReturnType<typeof getSpecialVaultContract>,
  pid,
  amount,
  gasPrice,
  account,
  oraclePrice,
  chainId,
) => {
  if (!contract.account) return undefined

  const value = new BigNumber(amount).times(DEFAULT_TOKEN_DECIMAL).toString()
  const totalFee = await getSpecialVaultContractFee({
    pid,
    chainId,
    gasPrice,
    oraclePrice,
    amount: value,
    userAddress: account,
    messageType: MessageTypes.Withdraw,
  })
  console.info(totalFee, 'unstake totalFee')
  return contract.write.withdraw([pid, BigInt(value)], {
    value: BigInt(totalFee),
    account: contract.account ?? '0x',
    chain: contract.chain,
  })
}