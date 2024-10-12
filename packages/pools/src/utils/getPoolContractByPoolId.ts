import { ChainId } from '@plexswap/chains'
import { Account, Address, Chain, GetContractReturnType, PublicClient, WalletClient, getContract } from 'viem'
import { cropChiefABI } from '../abi/CropChief'
import { getPoolsConfig } from '../constants'

interface Params {
  chainId?: ChainId
  poolId: number
  signer?: any
  publicClient?: any
}

type GetContractReturnType_<TAbi extends readonly unknown[]> = GetContractReturnType<TAbi, any, any> & {
  abi: TAbi
  address: Address
  account?: Account
  chain?: Chain
}

export function getCropChiefContract({
  address,
  signer,
  publicClient,
}: {
  address: Address
  signer?: WalletClient
  publicClient?: PublicClient
}): GetContractReturnType_<typeof cropChiefABI> {
  return {
    ...getContract({
      abi: cropChiefABI,
      address,
      client: {
        public: publicClient as PublicClient,
        wallet: signer,
      },
    }),
    abi: cropChiefABI,
    address,
    account: signer?.account,
    chain: signer?.chain,
  }
}

export function getPoolContractByPoolId({ chainId, poolId, signer, publicClient }: Params): any | null {
  if (!chainId) {
    return null
  }
  const pools = getPoolsConfig(chainId)
  const pool = pools?.find((p) => p.poolId === Number(poolId))
  if (!pool) {
    return null
  }
  const { contractAddress } = pool

  return getCropChiefContract({ address: contractAddress, signer, publicClient })
}
