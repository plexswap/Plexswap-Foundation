import { WNATIVE } from '@plexswap/sdk-core'
import { Address, PublicClient, getContract } from 'viem'
import { feeOnTransferDetectorAbi } from './../config/abis/FeeOnTransferDetector'
import { feeOnTransferDetectorAddresses } from './../config/constants'

const getFeeOnTransferDetectorContract = <TPublicClient extends PublicClient>(publicClient: TPublicClient) => {
  if (publicClient.chain && publicClient.chain.id in feeOnTransferDetectorAddresses) {
    return getContract({
      abi: feeOnTransferDetectorAbi,
      address: feeOnTransferDetectorAddresses[publicClient.chain.id as keyof typeof feeOnTransferDetectorAddresses],
      client: publicClient,
    })
  }

  return null
}

const AMOUNT = 100_000n

export async function fetchTokenFeeOnTransfer<TPublicClient extends PublicClient>(
  publicClient: TPublicClient,
  tokenAddress: Address,
) {
  if (!publicClient.chain) {
    throw new Error('Chain not found')
  }

  const contract = getFeeOnTransferDetectorContract(publicClient)
  const baseToken = WNATIVE[publicClient.chain.id as keyof typeof WNATIVE]
  if (!contract) {
    throw new Error('Fee on transfer detector contract not found')
  }
  if (!baseToken) {
    throw new Error('Base token not found')
  }

  if (tokenAddress.toLowerCase() === baseToken.address.toLowerCase()) {
    throw new Error('Token is base token')
  }

  return contract.simulate.validate([tokenAddress, baseToken.address, AMOUNT])
}

export async function fetchTokenFeeOnTransferBatch<TPublicClient extends PublicClient>(
  publicClient: TPublicClient,
  tokens: {
    address: Address
  }[],
) {
  if (!publicClient.chain) {
    throw new Error('Chain not found')
  }

  const contract = getFeeOnTransferDetectorContract(publicClient)

  if (!contract) {
    throw new Error('Fee on transfer detector contract not found')
  }

  const baseToken = WNATIVE[publicClient.chain.id as keyof typeof WNATIVE]
  if (!baseToken) {
    throw new Error('Base token not found')
  }

  const tokensWithoutBaseToken = tokens.filter(
    (token) => token.address.toLowerCase() !== baseToken.address.toLowerCase(),
  )

  return publicClient.multicall({
    allowFailure: true,
    contracts: tokensWithoutBaseToken.map(
      (token) =>
        ({
          address: contract.address as Address,
          abi: feeOnTransferDetectorAbi,
          functionName: 'validate',
          args: [token.address, baseToken.address, AMOUNT],
        } as const),
    ),
  })
}
