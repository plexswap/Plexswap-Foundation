import { BigintIsh, Currency } from '@plexswap/sdk-core'

import { OnChainProvider, Pool, PoolType, SubgraphProvider } from '../../types'
import { getExtendedCandidatePools } from './getExtendedCandidatePools'
import { getStableCandidatePools } from './getStableCandidatePools'
import { getCoreCandidatePools } from './getCoreCandidatePools'

export type GetCandidatePoolsParams = {
  currencyA?: Currency
  currencyB?: Currency

  // Only use this param if we want to specify pairs we want to get
  pairs?: [Currency, Currency][]

  onChainProvider?: OnChainProvider
  coreSubgraphProvider?: SubgraphProvider
  extendedSubgraphProvider?: SubgraphProvider
  blockNumber?: BigintIsh
  protocols?: PoolType[]
}

export async function getCandidatePools({
  protocols = [PoolType.EXTENDED, PoolType.CORE, PoolType.STABLE],
  coreSubgraphProvider,
  extendedSubgraphProvider,
  ...rest
}: GetCandidatePoolsParams): Promise<Pool[]> {
  const { currencyA } = rest
  const chainId = currencyA?.chainId
  if (!chainId) {
    return []
  }

  const poolSets = await Promise.all(
    protocols.map((protocol) => {
      if (protocol === PoolType.CORE) {
        return getCoreCandidatePools({ ...rest, coreSubgraphProvider, extendedSubgraphProvider })
      }
      if (protocol === PoolType.EXTENDED) {
        return getExtendedCandidatePools({ ...rest, subgraphProvider: extendedSubgraphProvider })
      }
      return getStableCandidatePools(rest)
    }),
  )

  return poolSets.reduce<Pool[]>((acc, cur) => [...acc, ...cur], [])
}
