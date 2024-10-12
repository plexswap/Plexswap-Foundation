import { ChainId } from '@plexswap/chains'
import { FarmBoosterExtendedAddress, FarmBoosterVoterAddress, Addresses } from '@plexswap/farms/config/extended'
import addresses from 'config/constants/contracts'
import { VaultKey } from '@plexswap/pools'

export const getAddressFromMap = (address: Addresses, chainId?: number): `0x${string}` => {
  return chainId && address[chainId] ? address[chainId] : address[ChainId.BSC]
}

export const getAddressFromMapNoFallback = (address: Addresses, chainId?: number): `0x${string}` | null => {
  return chainId ? address[chainId] : null
}

export const getChiefFarmerAddress = (chainId?: number) => {
  return getAddressFromMapNoFallback(addresses.chiefFarmer, chainId)
}

export const getChiefFarmerExtendedAddress = (chainId?: number) => {
  return getAddressFromMapNoFallback(addresses.chiefFarmerExtended, chainId)
}

export const getMulticallAddress = (chainId?: number) => {
  return getAddressFromMap(addresses.Multicall, chainId)
}

export const getVaultPoolAddress = (vaultKey: VaultKey, chainId?: ChainId) => {
  if (!vaultKey) {
    return null
  }
  return getAddressFromMap(addresses[vaultKey], chainId)
}

export const getWayaVaultAddress = (chainId?: number) => {
  return getAddressFromMap(addresses.wayaVault, chainId)
}

export const getWayaFlexibleVaultAddress = (chainId?: number) => {
  return getAddressFromMap(addresses.wayaFlexibleVault, chainId)
}

export const getFarmBoosterAddress = () => {
  return getAddressFromMap(addresses.FarmBooster)
}

export const getFarmBoosterExtendedAddress = (chainId?: number) => {
  return getAddressFromMap(FarmBoosterExtendedAddress, chainId)
}

export const getFarmBoosterVoterAddress = (chainId?: number) => {
  return getAddressFromMap(FarmBoosterVoterAddress, chainId)
}

export const getFarmBoosterProxyFactoryAddress = () => {
  return getAddressFromMap(addresses.FarmBoosterProxyFactory)
}

export const getSpecialVaultAddress = (chainId?: number) => {
  return getAddressFromMap(addresses.specialVault, chainId)
}

export const getCrossFarmingSenderAddress = (chainId?: number) => {
  return getAddressFromMap(addresses.crossFarmingSender, chainId)
}

export const getCrossFarmingReceiverAddress = (chainId?: number) => {
  return getAddressFromMap(addresses.crossFarmingReceiver, chainId)
}

export const getStableSwapNativeHelperAddress = (chainId?: number) => {
  return getAddressFromMap(addresses.stableSwapNativeHelper, chainId)
}

export const getVoterAddress = (chainId?: number) => {
  return getAddressFromMap(addresses.voter, chainId)
}

export const getVoterAddressNoFallback = (chainId?: number) => {
  return getAddressFromMapNoFallback(addresses.voter, chainId)
}

export const getExtendedMigratorAddress = (chainId?: number) => {
  return getAddressFromMap(addresses.extendedMigrator, chainId)
}
