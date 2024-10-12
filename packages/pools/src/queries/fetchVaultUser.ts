import { ChainId } from '@plexswap/chains'
import BigNumber from 'bignumber.js'
import { wayaFlexibleVaultABI } from '../abi/WayaFlexibleVault'
import { wayaVaultABI } from '../abi/WayaVault'
import { OnChainProvider, SerializedLockedVaultUser, SerializedVaultUser } from '../types'
import { getWayaVaultAddress } from './getAddresses'
import { Address } from 'viem'

interface Params {
  account: Address
  chainId: ChainId
  provider: OnChainProvider
}

export const fetchVaultUser = async ({ account, chainId, provider }: Params): Promise<SerializedLockedVaultUser> => {
  try {
    const wayaVaultAddress = getWayaVaultAddress(chainId)

    const client = provider({ chainId })

    const [userContractResponse, currentPerformanceFee, currentOverdueFee] = await client.multicall({
      contracts: [
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'userInfo',
          args: [account],
        },
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'calculatePerformanceFee',
          args: [account],
        },
        {
          abi: wayaVaultABI,
          address: wayaVaultAddress,
          functionName: 'calculateOverdueFee',
          args: [account],
        },
      ],
      allowFailure: false,
    })

    return {
      isLoading: false,
      userShares: new BigNumber(userContractResponse[0].toString()).toJSON(),
      lastDepositedTime: userContractResponse[1].toString(),
      lastUserActionTime: userContractResponse[3].toString(),
      wayaAtLastUserAction: new BigNumber(userContractResponse[2].toString()).toJSON(),
      userBoostedShare: new BigNumber(userContractResponse[6].toString()).toJSON(),
      locked: userContractResponse[7],
      lockEndTime: userContractResponse[5].toString(),
      lockStartTime: userContractResponse[4].toString(),
      lockedAmount: new BigNumber(userContractResponse[8].toString()).toJSON(),
      currentPerformanceFee: new BigNumber(currentPerformanceFee.toString()).toJSON(),
      currentOverdueFee: new BigNumber(currentOverdueFee.toString()).toJSON(),
    }
  } catch (error) {
    return {
      isLoading: true,
      userShares: '',
      lastDepositedTime: '',
      lastUserActionTime: '',
      wayaAtLastUserAction: '',
      userBoostedShare: '',
      lockEndTime: '',
      lockStartTime: '',
      locked: false,
      lockedAmount: '',
      currentPerformanceFee: '',
      currentOverdueFee: '',
    }
  }
}

export const fetchFlexibleVaultUser = async ({
  account,
  chainId,
  provider,
}: Params): Promise<SerializedVaultUser> => {
  try {
    const userContractResponse = await await provider({ chainId }).readContract({
      abi: wayaFlexibleVaultABI,
      address: getWayaVaultAddress(chainId),
      functionName: 'userInfo',
      args: [account],
    })
    return {
      isLoading: false,
      userShares: new BigNumber(userContractResponse[0].toString()).toJSON(),
      lastDepositedTime: userContractResponse[1].toString(),
      lastUserActionTime: userContractResponse[3].toString(),
      wayaAtLastUserAction: new BigNumber(userContractResponse[2].toString()).toJSON(),
    }
  } catch (error) {
    return {
      isLoading: true,
      userShares: '',
      lastDepositedTime: '',
      lastUserActionTime: '',
      wayaAtLastUserAction: '',
    }
  }
}
