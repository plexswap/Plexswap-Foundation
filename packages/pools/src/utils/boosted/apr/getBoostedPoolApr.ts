import { Address, PublicClient } from 'viem'
import { getBoostedPoolConfig } from '../../../constants/boostedPools'

interface GetBoostedPoolApr {
  client: PublicClient
  contractAddress: Address
  chainId: number | undefined
}

export const getBoostedPoolApr = async ({ client, contractAddress, chainId }: GetBoostedPoolApr): Promise<number> => {
  const pool = chainId && getBoostedPoolConfig(chainId, contractAddress)

  return 0
}
