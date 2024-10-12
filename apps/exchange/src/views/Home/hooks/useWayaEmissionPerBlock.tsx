import BigNumber from 'bignumber.js'
import { formatEther } from 'viem'
import { ChainId } from '@plexswap/chains'
import { chiefFarmerABI } from 'config/abi/ChiefFarmer'
import { getChiefFarmerAddress } from 'utils/addressHelpers'
import { useReadContract } from 'wagmi'

const chiefFarmerAddress = getChiefFarmerAddress(ChainId.BSC)!

export const useWayaEmissionPerBlock = (isRegularPool: boolean) => {
  const { data: emissionsPerBlock } = useReadContract({
    abi: chiefFarmerABI,
    address: chiefFarmerAddress,
    chainId: ChainId.BSC,
    functionName: 'wayaPerBlock',
    args: [isRegularPool],
    query: {
      select: (d) => {
        const blocks = formatEther(d)
        return new BigNumber(blocks).toNumber()
      },
    },
  })

  return emissionsPerBlock
}