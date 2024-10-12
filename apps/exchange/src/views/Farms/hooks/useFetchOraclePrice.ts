import { ChainId } from '@plexswap/chains'
import { useReadContract } from '@plexswap/wagmi'
import { getChainlinkOracleContract } from 'utils/contractHelpers'
import { Address } from 'viem'

const getOracleAddress = (chainId: number): Address | null => {
  switch (chainId) {
    case ChainId.PLEXCHAIN:
    default:
      return null
  }
}

export const useOraclePrice = (chainId?: number) => {
  const tokenAddress = chainId ? getOracleAddress(chainId) : undefined
  const chainlinkOracleContract = tokenAddress ? getChainlinkOracleContract(tokenAddress, undefined, ChainId.BSC) : null
  const { data: price } = useReadContract({
    abi: chainlinkOracleContract?.abi,
    chainId: ChainId.BSC,
    address: tokenAddress ?? undefined,
    functionName: 'latestAnswer',
    watch: true,
  })

  return price?.toString() ?? '0'
}
