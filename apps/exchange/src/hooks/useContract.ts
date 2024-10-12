import { getPoolContractByPoolId, VaultKey } from '@plexswap/pools'
import { Abi, Address, erc20Abi } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import { useMemo } from 'react'
import { getMulticallAddress } from 'utils/addressHelpers'
import {
  getContract,
  getVoterContract,
  getFarmBoosterContract,
  getFarmBoosterExtendedContract,
  getFarmBoosterVoterContract,
  getFarmWrapperBoosterVoterContract,
  getFarmBoosterProxyFactoryContract,
  getFarmBoosterProxyContract,
  getWayaFlexibleVaultContract,
  getWayaVaultContract,
  getChiefFarmerContract,
  getChiefFarmerExtendedContract,
  getChainlinkOracleContract,
  getSpecialVaultContract,
  getSpecialWayaWrapperContract,
  getCrossFarmingProxyContract,
  getStableSwapNativeHelperContract,
  getExtendedMigratorContract,
} from 'utils/contractHelpers'

import { ChainId } from '@plexswap/chains'
import { WNATIVE } from '@plexswap/sdk-core'
import { WAYA } from '@plexswap/tokens'
import { nonfungiblePositionManagerABI } from '@plexswap/sdk-extended'
import { erc721CollectionABI } from 'config/abi/erc721collection'
import { infoStableSwapABI } from 'config/abi/infoStableSwap'
import { wethABI } from 'config/abi/weth'
import addresses from 'config/constants/contracts'
import { erc20Bytes32ABI } from 'config/abi/erc20_bytes32'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { plexswapPairABI } from '../config/abi/PlexswapPair'
import { multicallABI } from '../config/abi/Multicall'


/**
 * Helper hooks to get specific contracts (by ABI)
 */

export const useERC20 = (address?: Address, options?: UseContractOptions) => {
  return useContract(address, erc20Abi, options)
}

export const useWaya = () => {
  const { chainId } = useActiveChainId()
  return useContract((chainId && WAYA[chainId]?.address) ?? WAYA[ChainId.BSC].address, erc20Abi)
}

export const useChieffarmer = () => {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(() => getChiefFarmerContract(signer ?? undefined, chainId), [signer, chainId])
}

export function useChieffarmerExtended() {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(() => getChiefFarmerExtendedContract(signer ?? undefined, chainId), [signer, chainId])
}


export const useCropChief = (id) => {
  const { data: signer } = useWalletClient()
  const { chainId } = useActiveChainId()
  const publicClient = usePublicClient({ chainId })
  return useMemo(
    () =>
      getPoolContractByPoolId({
        poolId: id,
        signer,
        chainId,
        publicClient,
      }),
    [id, signer, chainId, publicClient],
  )
}

export const useVaultPoolContract = <T extends VaultKey>(
  vaultKey?: T,
):
  | (T extends VaultKey.WayaVault
      ? ReturnType<typeof getWayaVaultContract>
      : ReturnType<typeof getWayaFlexibleVaultContract>)
  | null => {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(() => {
    if (vaultKey === VaultKey.WayaVault) {
      return getWayaVaultContract(signer ?? undefined, chainId)
    }
    if (vaultKey === VaultKey.WayaFlexibleVault) {
      return getWayaFlexibleVaultContract(signer ?? undefined, chainId)
    }
    return null
  }, [signer, vaultKey, chainId]) as any
}

export const useWayaVaultContract = (targetChain?: ChainId) => {
  const { data: signer } = useWalletClient()
  const { chainId } = useActiveChainId()
  return useMemo(
    () => getWayaVaultContract(signer ?? undefined, targetChain ?? chainId),
    [signer, chainId],
  )
}

export const useErc721CollectionContract = (collectionAddress: Address) => {
  return useContract(collectionAddress, erc721CollectionABI)
}

// Code below migrated from Exchange useContract.ts

type UseContractOptions = {
  chainId?: ChainId
}

// returns null on errors
export function useContract<TAbi extends Abi>(
  addressOrAddressMap?: Address | { [chainId: number]: Address },
  abi?: TAbi,
  options?: UseContractOptions,
) {
  const { chainId: currentChainId } = useActiveChainId()
  const chainId = options?.chainId || currentChainId
  const { data: walletClient } = useWalletClient()

  return useMemo(() => {
    if (!addressOrAddressMap || !abi || !chainId) return null
    let address: Address | undefined
    if (typeof addressOrAddressMap === 'string') address = addressOrAddressMap
    else address = addressOrAddressMap[chainId]
    if (!address) return null
    try {
      return getContract({
        abi,
        address,
        chainId,
        signer: walletClient ?? undefined,
      })
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [addressOrAddressMap, abi, chainId, walletClient])
}

export function useTokenContract(tokenAddress?: Address) {
  return useContract(tokenAddress, erc20Abi)
}

export function useWNativeContract() {
  const { chainId } = useActiveChainId()
  return useContract(chainId ? WNATIVE[chainId]?.address : undefined, wethABI)
}

export const useVoterContract = (targetChain?: ChainId) => {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(() => getVoterContract(signer ?? undefined, targetChain ?? chainId), [chainId, signer, targetChain])
}


export function useBytes32TokenContract(tokenAddress?: Address) {
  return useContract(tokenAddress, erc20Bytes32ABI)
}

export function usePairContract(pairAddress?: Address, options?: UseContractOptions) {
  return useContract(pairAddress, plexswapPairABI, options)
}

export function useMulticallContract() {
  const { chainId } = useActiveChainId()
  return useContract(getMulticallAddress(chainId), multicallABI)
}

export function useFarmBoosterContract() {
  const { data: signer } = useWalletClient()
  return useMemo(() => getFarmBoosterContract(signer ?? undefined), [signer])
}

export function useFarmBoosterExtendedContract() {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(() => getFarmBoosterExtendedContract(signer ?? undefined, chainId), [signer, chainId])
}

export function useFarmBoosterVoterContract() {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(() => getFarmBoosterVoterContract(signer ?? undefined, chainId), [signer, chainId])
}

export function useWayaFarmWrapperBoosterVoterContract(address: Address) {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(
    () => getFarmWrapperBoosterVoterContract(address, signer ?? undefined, chainId),
    [signer, chainId, address],
  )
}

export function useFarmBoosterProxyFactoryContract() {
  const { data: signer } = useWalletClient()
  return useMemo(() => getFarmBoosterProxyFactoryContract(signer ?? undefined), [signer])
}

export function useFarmBoosterProxyContract(proxyContractAddress: Address) {
  const { data: signer } = useWalletClient()
  return useMemo(
    () => proxyContractAddress && getFarmBoosterProxyContract(proxyContractAddress, signer ?? undefined),
    [signer, proxyContractAddress],
  )
}

export const useChainlinkOracleContract = (address) => {
  const { data: signer } = useWalletClient()
  return useMemo(() => getChainlinkOracleContract(address, signer ?? undefined), [signer, address])
}

export function useSpecialWayaWrapperContract(address: Address) {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(() => getSpecialWayaWrapperContract(address, signer ?? undefined, chainId), [signer, chainId, address])
}
export const useSpecialVault = () => {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(() => getSpecialVaultContract(signer ?? undefined, chainId), [signer, chainId])
}

export const useCrossFarmingProxy = (proxyContractAddress?: Address) => {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(
    () => proxyContractAddress && getCrossFarmingProxyContract(proxyContractAddress, signer ?? undefined, chainId),
    [proxyContractAddress, signer, chainId],
  )
}
export function useExtendedMigratorContract() {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(() => getExtendedMigratorContract(signer ?? undefined, chainId), [chainId, signer])
}

export const useInfoStableSwapContract = (infoAddress?: Address) => {
  return useContract(infoAddress, infoStableSwapABI)
}

export const useStableSwapNativeHelperContract = () => {
  const { chainId } = useActiveChainId()
  const { data: signer } = useWalletClient()
  return useMemo(() => getStableSwapNativeHelperContract(signer ?? undefined, chainId), [signer, chainId])
}

export function useExtendedNFTPositionManagerContract() {
  return useContract(addresses.nftPositionManager, nonfungiblePositionManagerABI)
}