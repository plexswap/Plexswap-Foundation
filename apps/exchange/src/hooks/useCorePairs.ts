import { Pair } from '@plexswap/sdk-core'
import { useMemo } from 'react'
import { coreLiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { PairState, useCorePairs } from './usePairs'

export default function useCorePairsByAccount(account: string | undefined) {
  // fetch the user's balances of all tracked Core LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()

  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: coreLiquidityToken(tokens), tokens })),
    [trackedTokenPairs],
  )
  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens],
  )
  const [corePairsBalances, fetchingCorePairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens,
  )

  // fetch the reserves for all Core pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        corePairsBalances[liquidityToken.address]?.greaterThan('0'),
      ),
    [tokenPairsWithLiquidityTokens, corePairsBalances],
  )

  const corePairs = useCorePairs(
    useMemo(() => liquidityTokensWithBalances.map(({ tokens }) => tokens), [liquidityTokensWithBalances]),
  )

  return useMemo(() => {
    const coreIsLoading =
      fetchingCorePairBalances ||
      corePairs?.length < liquidityTokensWithBalances.length ||
      (corePairs?.length && corePairs.every(([pairState]) => pairState === PairState.LOADING))
    const allCorePairsWithLiquidity: (Pair | null)[] = corePairs
      ?.filter(([pairState, pair]) => pairState === PairState.EXISTS && Boolean(pair))
      .map(([, pair]) => pair)

    return {
      data: allCorePairsWithLiquidity,
      loading: coreIsLoading,
    }
  }, [fetchingCorePairBalances, liquidityTokensWithBalances.length, corePairs])
}