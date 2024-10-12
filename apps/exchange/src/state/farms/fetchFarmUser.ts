import { ChainId, verifyBscNetwork } from '@plexswap/chains'
import BigNumber from 'bignumber.js'
import { chiefFarmerABI } from 'config/abi/ChiefFarmer'
import { specialVaultABI } from 'config/abi/specialVault'
import { wayaWrapperABI } from 'config/abi/WayaWrapper'
import { SerializedFarmConfig, SerializedFarmPublicData } from '@plexswap/farms'
import { farmFetcher } from 'state/farms'
import { getChiefFarmerAddress, getSpecialVaultAddress } from 'utils/addressHelpers'
import { getCrossFarmingReceiverContract } from 'utils/contractHelpers'
import { publicClient } from 'utils/wagmi'
import { Address, erc20Abi } from 'viem'

export const fetchFarmUserAllowances = async (
  account: Address,
  farmsToFetch: SerializedFarmPublicData[],
  chainId: number,
) => {
  const isBscNetwork = verifyBscNetwork(chainId)
  const chiefFarmerAddress = isBscNetwork ? getChiefFarmerAddress(chainId)! : getSpecialVaultAddress(chainId)

  const lpAllowances = await publicClient({ chainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      const lpContractAddress = farm.lpAddress
      return {
        abi: erc20Abi,
        address: lpContractAddress,
        functionName: 'allowance',
        args: [account, chiefFarmerAddress] as const,
      } as const
    }),
    allowFailure: false,
  })

  const parsedLpAllowances = lpAllowances.map((lpBalance) => {
    return new BigNumber(lpBalance.toString()).toJSON()
  })

  return parsedLpAllowances
}

export const fetchFarmWayaWrapperUserAllowances = async (
  account: Address,
  farmsToFetch: SerializedFarmPublicData[],
  chainId: number,
) => {
  const lpAllowances = await publicClient({ chainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      const lpContractAddress = farm.lpAddress
      return {
        abi: erc20Abi,
        address: lpContractAddress,
        functionName: 'allowance',
        args: [account, farm?.wayaWrapperAddress ?? '0x'] as const,
      } as const
    }),
    allowFailure: false,
  })

  const parsedLpAllowances = lpAllowances.map((lpBalance) => {
    return new BigNumber(lpBalance.toString()).toJSON()
  })

  return parsedLpAllowances
}

export const fetchFarmUserTokenBalances = async (
  account: string,
  farmsToFetch: SerializedFarmConfig[],
  chainId: number,
) => {
  const rawTokenBalances = await publicClient({ chainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      const lpContractAddress = farm.lpAddress
      return {
        abi: erc20Abi,
        address: lpContractAddress,
        functionName: 'balanceOf',
        args: [account as Address] as const,
      } as const
    }),
    allowFailure: false,
  })

  const parsedTokenBalances = rawTokenBalances.map((tokenBalance) => {
    return new BigNumber(tokenBalance.toString()).toJSON()
  })
  return parsedTokenBalances
}

export const fetchFarmUserStakedBalances = async (
  account: string,
  farmsToFetch: SerializedFarmConfig[],
  chainId: number,
) => {
  const isBscNetwork = verifyBscNetwork(chainId)
  const chiefFarmerAddress = isBscNetwork ? getChiefFarmerAddress(chainId)! : getSpecialVaultAddress(chainId)

  const rawStakedBalances = await publicClient({ chainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      return {
        abi: isBscNetwork ? chiefFarmerABI : specialVaultABI,
        address: chiefFarmerAddress,
        functionName: 'userInfo',
        args: [BigInt(farm.vaultPid ?? farm.pid), account as Address] as const,
      } as const
    }),
    allowFailure: false,
  })

  const parsedStakedBalances = rawStakedBalances.map((stakedBalance) => {
    return new BigNumber(stakedBalance[0].toString()).toJSON()
  })
  return parsedStakedBalances
}

export const fetchFarmUserWayaWrapperStakedBalances = async (
  account: string,
  farmsToFetch: SerializedFarmPublicData[],
  chainId: number,
) => {
  const boosterPrecision = '1000000000000'
  const rawStakedBalances = await publicClient({ chainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      return {
        abi: wayaWrapperABI,
        address: farm?.wayaWrapperAddress ?? '0x',
        functionName: 'userInfo',
        args: [account as Address] as const,
      } as const
    }),
    allowFailure: false,
  })

  const parsedStakedBalances = rawStakedBalances.map((stakedBalance) => {
    return new BigNumber(stakedBalance[0].toString()).toJSON()
  })
  const boosterMultiplier = rawStakedBalances.map((stakedBalance) => {
    return new BigNumber(stakedBalance[2].toString()).div(boosterPrecision).toNumber()
  })
  const boostedAmounts = rawStakedBalances.map((stakedBalance) => {
    return new BigNumber(stakedBalance[3].toString()).toJSON()
  })

  return { parsedStakedBalances, boosterMultiplier, boostedAmounts }
}

export const fetchFarmUserWayaWrapperConstants = async (farmsToFetch: SerializedFarmPublicData[], chainId: number) => {
  const boosterContractAddress = await publicClient({ chainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      return {
        abi: wayaWrapperABI,
        address: farm?.wayaWrapperAddress ?? '0x',
        functionName: 'boostContract',
      } as const
    }),
    allowFailure: false,
  })
  const startTimestamp = await publicClient({ chainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      return {
        abi: wayaWrapperABI,
        address: farm?.wayaWrapperAddress ?? '0x',
        functionName: 'startTimestamp',
      } as const
    }),
    allowFailure: false,
  })
  const endTimestamp = await publicClient({ chainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      return {
        abi: wayaWrapperABI,
        address: farm?.wayaWrapperAddress ?? '0x',
        functionName: 'endTimestamp',
      } as const
    }),
    allowFailure: false,
  })

  return {
    boosterContractAddress,
    startTimestamp: startTimestamp.map((d) => Number(d)),
    endTimestamp: endTimestamp.map((d) => Number(d)),
  }
}

export const fetchFarmUserWayaWrapperRewardPerSec = async (
  farmsToFetch: SerializedFarmPublicData[],
  chainId: number,
) => {
  const rewardPerSec = await publicClient({ chainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      return {
        abi: wayaWrapperABI,
        address: farm?.wayaWrapperAddress ?? '0x',
        functionName: 'rewardPerSecond',
      } as const
    }),
    allowFailure: false,
  })

  return { rewardPerSec: rewardPerSec.map((reward) => Number(reward)) }
}

export const fetchFarmUserEarnings = async (
  account: Address,
  farmsToFetch: SerializedFarmConfig[],
  chainId: number,
) => {
  const isBscNetwork = verifyBscNetwork(chainId)
  const multiCallChainId = farmFetcher.isTestnet(chainId) ? ChainId.BSC_TESTNET : ChainId.BSC
  const userAddress = isBscNetwork ? account : await fetchCProxyAddress(account, multiCallChainId)
  const chiefFarmerAddress = getChiefFarmerAddress(multiCallChainId)!

  const rawEarnings = await publicClient({ chainId: multiCallChainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      return {
        abi: chiefFarmerABI,
        address: chiefFarmerAddress,
        functionName: 'pendingWaya',
        args: [BigInt(farm.pid), userAddress as Address] as const,
      } as const
    }),
    allowFailure: false,
  })

  const parsedEarnings = rawEarnings.map((earnings) => {
    return new BigNumber(earnings.toString()).toJSON()
  })
  return parsedEarnings
}

export const fetchFarmUserWayaWrapperEarnings = async (
  account: Address,
  farmsToFetch: SerializedFarmPublicData[],
  chainId: number,
) => {
  const rawEarnings = await publicClient({ chainId }).multicall({
    contracts: farmsToFetch.map((farm) => {
      return {
        abi: wayaWrapperABI,
        address: farm?.wayaWrapperAddress ?? '0x',
        functionName: 'pendingReward',
        args: [account] as const,
      } as const
    }),
    allowFailure: false,
  })
  const parsedEarnings = rawEarnings.map((earnings) => {
    return new BigNumber(earnings.toString()).toJSON()
  })
  return parsedEarnings
}

export const fetchCProxyAddress = async (address: Address, chainId: number) => {
  try {
    const crossFarmingAddress = getCrossFarmingReceiverContract(undefined, chainId)
    const cProxyAddress = await crossFarmingAddress.read.cProxy([address])
    return cProxyAddress
  } catch (error) {
    console.error('Failed Fetch CProxy Address', error)
    return address
  }
}