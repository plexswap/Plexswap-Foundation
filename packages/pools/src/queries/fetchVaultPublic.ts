import { ChainId } from '@plexswap/chains'
import { WAYA } from '@plexswap/tokens'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import BigNumber from 'bignumber.js'
import { Address } from 'viem'
import { wayaVaultABI } from '../abi/WayaVault'
import { OnChainProvider } from '../types'
import { getWayaVaultAddress } from './getAddresses'

interface Params {
  wayaVaultAddress?: Address
  chainId: ChainId
  provider: OnChainProvider
}

const balanceOfAbi = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const fetchPublicVaultData = async ({
  chainId,
  wayaVaultAddress = getWayaVaultAddress(chainId),
  provider,
}: Params) => {
  try {
    const client = provider({ chainId })

    const [sharePrice, shares, totalLockedAmount, totalWayaInVault] = await client.multicall({
      contracts: [
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'getPricePerFullShare',
        },
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'totalShares',
        },
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'totalLockedAmount',
        },
        {
          abi: balanceOfAbi,
          address: WAYA[ChainId.BSC].address,
          functionName: 'balanceOf',
          args: [wayaVaultAddress],
        },
      ],
      allowFailure: true,
    })

    const totalSharesAsBigNumber =
      shares.status === 'success' && shares.result ? new BigNumber(shares.result.toString()) : BIG_ZERO
    const totalLockedAmountAsBigNumber =
      totalLockedAmount.status === 'success' && totalLockedAmount.result
        ? new BigNumber(totalLockedAmount.result.toString())
        : BIG_ZERO
    const sharePriceAsBigNumber =
      sharePrice.status === 'success' && sharePrice.result ? new BigNumber(sharePrice.result.toString()) : BIG_ZERO

    return {
      totalShares: totalSharesAsBigNumber.toJSON(),
      totalLockedAmount: totalLockedAmountAsBigNumber.toJSON(),
      pricePerFullShare: sharePriceAsBigNumber.toJSON(),
      totalWayaInVault: totalWayaInVault.result ? new BigNumber(totalWayaInVault.result.toString()).toJSON() : '0',
    }
  } catch (error) {
    return {
      totalShares: null,
      totalLockedAmount: null,
      pricePerFullShare: null,
      totalWayaInVault: null,
    }
  }
}

export const fetchPublicFlexibleVaultData = async ({
  chainId,
  wayaVaultAddress = getWayaVaultAddress(chainId),
  provider,
}: Params) => {
  try {
    const client = provider({ chainId })

    const [sharePrice, shares, totalWayaInVault] = await client.multicall({
      contracts: [
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'getPricePerFullShare',
        },
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'totalShares',
        },
        {
          abi: balanceOfAbi,
          address: WAYA[ChainId.BSC].address,
          functionName: 'balanceOf',
          args: [wayaVaultAddress],
        },
      ],
      allowFailure: true,
    })

    const totalSharesAsBigNumber = shares.status === 'success' ? new BigNumber(shares.result.toString()) : BIG_ZERO
    const sharePriceAsBigNumber =
      sharePrice.status === 'success' ? new BigNumber(sharePrice.result.toString()) : BIG_ZERO
    return {
      totalShares: totalSharesAsBigNumber.toJSON(),
      pricePerFullShare: sharePriceAsBigNumber.toJSON(),
      totalWayaInVault: new BigNumber((totalWayaInVault.result || '0').toString()).toJSON(),
    }
  } catch (error) {
    return {
      totalShares: null,
      pricePerFullShare: null,
      totalWayaInVault: null,
    }
  }
}

export const fetchVaultFees = async ({
  chainId,
  wayaVaultAddress = getWayaVaultAddress(chainId),
  provider,
}: Params) => {
  try {
    const client = provider({ chainId })

    const [performanceFee, withdrawalFee, withdrawalFeePeriod] = await client.multicall({
      contracts: [
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'performanceFee',
        },
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'withdrawFee',
        },
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'withdrawFeePeriod',
        },
      ],
      allowFailure: false,
    })

    return {
      performanceFee: Number(performanceFee),
      withdrawalFee: Number(withdrawalFee),
      withdrawalFeePeriod: Number(withdrawalFeePeriod),
    }
  } catch (error) {
    return {
      performanceFee: null,
      withdrawalFee: null,
      withdrawalFeePeriod: null,
    }
  }
}
