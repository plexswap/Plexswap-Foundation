import { ChainId } from '@plexswap/chains'
import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { getPortalRoot } from '@plexswap/ui-plex'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { SubgraphHealthIndicator, SubgraphHealthIndicatorProps } from './SubgraphHealthIndicator'

interface FactoryParams {
  getSubgraphName: (chainId: ChainId) => string
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export function subgraphHealthIndicatorFactory({ getSubgraphName }: FactoryParams) {
  return function Indicator(props: PartialBy<SubgraphHealthIndicatorProps, 'subgraphName' | 'chainId'>) {
    const { chainId } = useActiveChainId()

    const subgraphName = useMemo(() => {
      if (props.chainId) {
        return getSubgraphName(props.chainId)
      }
      if (chainId) {
        return getSubgraphName(chainId)
      }
      return undefined
    }, [chainId, props?.chainId])

    if (!subgraphName) {
      return null
    }

    const portalRoot = getPortalRoot()

    return portalRoot
      ? createPortal(<SubgraphHealthIndicator chainId={chainId} subgraphName={subgraphName} {...props} />, portalRoot)
      : null
  }
}

