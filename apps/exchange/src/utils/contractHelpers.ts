import { WAYA } from '@plexswap/tokens'

// ADDRESSES
import {
  getChiefFarmerAddress,
  getChiefFarmerExtendedAddress,
  getWayaVaultAddress,
  getWayaFlexibleVaultAddress,
  getFarmBoosterAddress,
  getFarmBoosterExtendedAddress,
  getFarmBoosterVoterAddress,
  getFarmBoosterProxyFactoryAddress,
  getSpecialVaultAddress,
  getCrossFarmingReceiverAddress,
  getCrossFarmingSenderAddress,
  getStableSwapNativeHelperAddress,
  getVoterAddress,
  getExtendedMigratorAddress
} from 'utils/addressHelpers'

// ABI
import { lpTokenABI } from 'config/abi/lpToken'
import { voterABI } from 'config/abi/Voter'
import { chiefFarmerABI } from 'config/abi/ChiefFarmer'
import { chiefFarmerExtendedABI } from '@plexswap/sdk-extended'
import { specialVaultABI } from 'config/abi/specialVault'
import { wayaVaultABI } from 'config/abi/WayaVault'
import { wayaFlexibleVaultABI } from 'config/abi/WayaFlexibleVault'
import { wayaWrapperABI } from 'config/abi/WayaWrapper'
import { farmBoosterABI } from 'config/abi/FarmBooster'
import { farmBoosterProxyFactoryABI } from 'config/abi/FarmBoosterProxyFactory'
import { farmBoosterProxyABI } from 'config/abi/FarmBoosterProxy'
import { farmBoosterExtendedABI } from '@plexswap/farms/config/extended/abi/FarmBoosterExtended'
import { farmBoosterVoterABI } from '@plexswap/farms/config/extended/abi/FarmBoosterVoter'
import { farmWrapperBoosterVoterABI } from '@plexswap/farms/config/extended/abi/FarmWrapperBoosterVoter'
import { extendedMigratorABI } from 'config/abi/extendedMigrator'
import { chainlinkOracleABI } from 'config/abi/chainlinkOracle'
import { crossFarmingProxyABI } from 'config/abi/crossFarmingProxy'
import { crossFarmingReceiverABI } from 'config/abi/crossFarmingReceiver'
import { crossFarmingSenderABI } from 'config/abi/crossFarmingSender'
import { stableSwapNativeHelperABI } from 'config/abi/stableSwapNativeHelper'
import { ChainId } from '@plexswap/chains'
import { viemClients } from 'utils/viem'
import {
    Abi,
    Address,
    GetContractReturnType,
    PublicClient,
    WalletClient,
    erc20Abi,
    erc721Abi,
    getContract as viemGetContract,
} from 'viem'

export const getContract = <TAbi extends Abi | readonly unknown[], TWalletClient extends WalletClient>({
  abi,
  address,
  chainId = ChainId.BSC,
  publicClient,
  signer,
}: {
  abi: TAbi | readonly unknown[]
  address: Address
  chainId?: ChainId
  signer?: TWalletClient
  publicClient?: PublicClient
}) => {
  const c = viemGetContract({
    abi,
    address,
    client: {
      public: publicClient ?? viemClients[chainId],
      wallet: signer,
    },
  }) as unknown as GetContractReturnType<TAbi, PublicClient, Address>

  return {
    ...c,
    account: signer?.account,
    chain: signer?.chain,
  }
}

export const getBep20Contract = (address: Address, signer?: WalletClient) => {
  return getContract({ abi: erc20Abi, address, signer })
}

export const getErc721Contract = (address: Address, walletClient?: WalletClient) => {
  return getContract({
    abi: erc721Abi,
    address,
    signer: walletClient,
  })
}
export const getLpContract = (address: Address, chainId?: number, signer?: WalletClient) => {
  return getContract({ 
    abi: lpTokenABI, 
    address, 
    signer, 
    chainId 
  })
}

export const getChiefFarmerContract = (signer?: WalletClient, chainId?: number) => {
  const chieffarmerAddress = getChiefFarmerAddress(chainId)
  return chieffarmerAddress
    ? getContract({
        abi: chiefFarmerABI,
        address: chieffarmerAddress,
        chainId,
        signer,
      })
    : null
}

export const getChiefFarmerExtendedContract = (signer?: WalletClient, chainId?: number) => {
  const chieffarmerExtendedAddress = getChiefFarmerExtendedAddress(chainId)
  return chieffarmerExtendedAddress
    ? getContract({
        abi: chiefFarmerExtendedABI,
        address: chieffarmerExtendedAddress,
        chainId,
        signer,
      })
    : null
}


export const getWayaContract = (chainId?: number) => {
  return getContract({
    abi: erc20Abi,       
    address: chainId ? WAYA[chainId]?.address : WAYA[ChainId.BSC].address,
    chainId,
  })
}

export const getWayaVaultContract = (signer?: WalletClient, chainId?: number) => {
  return getContract({ 
    abi: wayaVaultABI, 
    address: getWayaVaultAddress(chainId), 
    signer, 
    chainId 
  })
}

export const getWayaFlexibleVaultContract = (signer?: WalletClient, chainId?: number) => {
  return getContract({
    abi: wayaFlexibleVaultABI,
    address: getWayaFlexibleVaultAddress(chainId),
    signer,
    chainId,
  })
}

export const getFarmBoosterContract = (signer?: WalletClient) => {
  return getContract({ 
	  abi: farmBoosterABI, 
	  address: getFarmBoosterAddress(), 
	  signer 
  })
}

export const getFarmBoosterProxyFactoryContract = (signer?: WalletClient) => {
  return getContract({
    abi: farmBoosterProxyFactoryABI,
    address: getFarmBoosterProxyFactoryAddress(),
    signer,
  })
}

export const getFarmBoosterProxyContract = (proxyContractAddress: Address, signer?: WalletClient) => {
  return getContract({ abi: farmBoosterProxyABI, address: proxyContractAddress, signer })
}

export const getFarmBoosterExtendedContract = (signer?: WalletClient, chainId?: number) => {
  return getContract({ abi: farmBoosterExtendedABI, address: getFarmBoosterExtendedAddress(chainId), signer, chainId })
}

export const getFarmBoosterVoterContract = (signer?: WalletClient, chainId?: number) => {
  return getContract({
    abi: farmBoosterVoterABI,
    address: getFarmBoosterVoterAddress(chainId),
    signer,
    chainId,
  })
}

export const getFarmWrapperBoosterVoterContract = (address: Address, signer?: WalletClient, chainId?: number) => {
  return getContract({
    abi: farmWrapperBoosterVoterABI,
    address,
    signer,
    chainId,
  })
}

export const getSpecialWayaWrapperContract = (address: Address, signer?: WalletClient, chainId?: number) => {
  return getContract({
    abi: wayaWrapperABI,
    address,
    signer,
    chainId,
  })
}

export const getVoterContract = (signer?: WalletClient, chainId?: number) => {
  return getContract({
    abi: voterABI,
    address: getVoterAddress(chainId) ?? getVoterAddress(ChainId.BSC),
    signer,
    chainId,
  })
}

export const getChainlinkOracleContract = (address: Address, signer?: WalletClient, chainId?: number) => {
  return getContract({ abi: chainlinkOracleABI, address, signer, chainId })
}

export const getSpecialVaultContract = (signer?: WalletClient, chainId?: number) => {
  return getContract({ 
    abi: specialVaultABI, 
    address: getSpecialVaultAddress(chainId), 
    chainId,
    signer 
  })
}

export const getCrossFarmingSenderContract = (signer?: WalletClient, chainId?: number) => {
  return getContract({
    abi: crossFarmingSenderABI,
    address: getCrossFarmingSenderAddress(chainId),
    chainId,
    signer,
  })
}

export const getCrossFarmingReceiverContract = (signer?: WalletClient, chainId?: number) => {
  return getContract({
    abi: crossFarmingReceiverABI,
    address: getCrossFarmingReceiverAddress(chainId),
    chainId,
    signer,
  })
}

export const getCrossFarmingProxyContract = (
  proxyContractAddress: Address,
  signer?: WalletClient,
  chainId?: number,
) => {
  return getContract({ abi: crossFarmingProxyABI, address: proxyContractAddress, chainId, signer })
}

export const getStableSwapNativeHelperContract = (signer?: WalletClient, chainId?: number) => {
  return getContract({
    abi: stableSwapNativeHelperABI,
    address: getStableSwapNativeHelperAddress(chainId),
    chainId,
    signer,
  })
}

export const getExtendedMigratorContract = (signer?: WalletClient, chainId?: number) => {
  return getContract({
    abi: extendedMigratorABI,
    address: getExtendedMigratorAddress(chainId),
    chainId,
    signer,
  })
}