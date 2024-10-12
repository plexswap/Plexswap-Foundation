import { CoreRouter } from '@plexswap/gateway-guardians/Khaos'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useMemo } from 'react'

export function useStableSwapPairs() {
  const { chainId } = useActiveChainId()

  return useMemo(() => (chainId && CoreRouter.stableSwapPairsByChainId[chainId]) || [], [chainId])
}
