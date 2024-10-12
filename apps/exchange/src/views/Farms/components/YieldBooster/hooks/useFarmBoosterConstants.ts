import { ChainId } from '@plexswap/chains'
import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { farmBoosterABI } from 'config/abi/FarmBooster'
import { useMemo } from 'react'
import { getFarmBoosterAddress } from 'utils/addressHelpers'
import { publicClient } from 'utils/wagmi'

const useFarmBoosterConstants = () => {
  const FarmBoosterAddress = getFarmBoosterAddress()

  const { data, status } = useQuery({
    queryKey: ['farmBoosterConstants'],

    queryFn: async () => {
      return publicClient({ chainId: ChainId.BSC }).multicall({
        contracts: [
          {
            address: FarmBoosterAddress,
            abi: farmBoosterABI,
            functionName: 'lMaxBoost',
          },
          {
            address: FarmBoosterAddress,
            abi: farmBoosterABI,
            functionName: 'LMB_PRECISION',
          },
          {
            address: FarmBoosterAddress,
            abi: farmBoosterABI,
            functionName: 'controlDifficulties',
          },
        ],
        allowFailure: false,
      })
    },

    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })
  return useMemo(() => {
    return {
      constants: data && {
        lMaxBoost: new BigNumber(data[0].toString()).div(new BigNumber(data[1].toString())).toNumber(),
        cDifficulties: (new BigNumber(data[2].toString()).toNumber()),
      },
      isLoading: status !== 'success',
    }
  }, [data, status])
}

export default useFarmBoosterConstants
