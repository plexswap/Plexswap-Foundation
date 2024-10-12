import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { useMatchBreakpoints } from '@plexswap/ui-plex'
import { getBalanceNumber } from '@plexswap/utils/formatBalance'
import { memo, useCallback, useMemo } from 'react'
import { useDeserializedPoolByVaultKey, usePool, useVaultPoolByKey } from 'state/pools/hooks'
import { VaultKey } from '@plexswap/pools'
import { Token } from '@plexswap/sdk-core'
import ActionPanel from './ActionPanel/ActionPanel'
import AprCell from './Cells/AprCell'
import AutoAprCell from './Cells/AutoAprCell'
import AutoEarningsCell from './Cells/AutoEarningsCell'
import EarningsCell from './Cells/EarningsCell'
import NameCell from './Cells/NameCell'
import StakedCell from './Cells/StakedCell'
import TotalStakedCell from './Cells/TotalStakedCell'

export const VaultPoolRow: React.FC<
  React.PropsWithChildren<{ vaultKey: VaultKey; account: string; initialActivity?: boolean }>
> = memo(({ vaultKey, account, initialActivity }) => {
  const { isLg, isXl, isXxl } = useMatchBreakpoints()
  const isLargerScreen = isLg || isXl || isXxl
  const isXLargerScreen = isXl || isXxl
  const pool = useDeserializedPoolByVaultKey(vaultKey) as Pool.DeserializedPoolLockedVault<Token>
  const { totalWayaInVault } = useVaultPoolByKey(vaultKey)

  const { stakingToken, totalStaked } = pool

  const totalStakedBalance = useMemo(() => {
    return getBalanceNumber(totalWayaInVault, stakingToken.decimals)
  }, [stakingToken.decimals, totalWayaInVault])

  return (
    <Pool.ExpandRow initialActivity={initialActivity} panel={<ActionPanel account={account} pool={pool} expanded />}>
      <NameCell pool={pool} />
      {account && (
        <>
          {isXLargerScreen && <AutoEarningsCell pool={pool} account={account} />}
          {isXLargerScreen ? <StakedCell pool={pool} account={account} /> : null}
          <AutoAprCell pool={pool} />
          {isLargerScreen && (
            <TotalStakedCell
              stakingToken={stakingToken}
              totalStaked={totalStaked}
              totalStakedBalance={totalStakedBalance}
            />
          )}
        </>
      )}
    </Pool.ExpandRow>
  )
})

const PoolRow: React.FC<React.PropsWithChildren<{ poolId: number; account: string; initialActivity?: boolean }>> = ({
  poolId,
  account,
  initialActivity,
}) => {
  const { isLg, isXl, isXxl, isDesktop } = useMatchBreakpoints()
  const isLargerScreen = isLg || isXl || isXxl
  const { pool } = usePool(poolId)
  const stakingToken = pool?.stakingToken
  const totalStaked = pool?.totalStaked

  const totalStakedBalance = useMemo(() => {
    return getBalanceNumber(totalStaked, stakingToken?.decimals)
  }, [stakingToken?.decimals, totalStaked])

  const getNow = useCallback(() => Date.now(), [])

  return pool ? (
    <Pool.ExpandRow initialActivity={initialActivity} panel={<ActionPanel account={account} pool={pool} expanded />}>
      <NameCell pool={pool} />
      <EarningsCell pool={pool} account={account} />
      {isLargerScreen && stakingToken && (
        <TotalStakedCell
          stakingToken={stakingToken}
          totalStaked={totalStaked}
          totalStakedBalance={totalStakedBalance}
        />
      )}
      <AprCell pool={pool} />
      {isDesktop && <Pool.EndsInCell pool={pool} getNow={getNow} />}
    </Pool.ExpandRow>
  ) : null
}

export default memo(PoolRow)
