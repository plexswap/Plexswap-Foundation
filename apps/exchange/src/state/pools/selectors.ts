import { createSelector } from '@reduxjs/toolkit'
import { VaultKey } from '@plexswap/pools'
import { VaultPosition, getVaultPosition } from '../../utils/wayaPool'
import { State } from '../types'
import { transformPool, transformVault } from './helpers'
import { initialPoolVaultState } from './index'

const selectPoolsData = (state: State) => state.pools.data
const selectPoolData = (poolId) => (state: State) => state.pools.data.find((p) => p.poolId === poolId)
const selectUserDataLoaded = (state: State) => state.pools.userDataLoaded
const selectVault = (key: VaultKey) => (state: State) => key ? state.pools[key] : initialPoolVaultState

export const makePoolWithUserDataLoadingSelector = (poolId: number) =>
  createSelector([selectPoolData(poolId), selectUserDataLoaded], (pool, userDataLoaded) => {
    return { pool: pool ? transformPool(pool) : undefined, userDataLoaded }
  })

export const poolsWithUserDataLoadingSelector = createSelector(
  [selectPoolsData, selectUserDataLoaded],
  (pools, userDataLoaded) => {
    return { pools: pools.map(transformPool), userDataLoaded }
  },
)

export const makeVaultPoolByKey = (key) => createSelector([selectVault(key)], (vault) => transformVault(key, vault))

export const poolsWithVaultSelector = createSelector(
  [
    poolsWithUserDataLoadingSelector,
    makeVaultPoolByKey(VaultKey.WayaVault),
    makeVaultPoolByKey(VaultKey.WayaFlexibleVault),
  ],
  (poolsWithUserDataLoading, deserializedLockedWayaVault, deserializedFlexibleWayaVault) => {
    const { pools, userDataLoaded } = poolsWithUserDataLoading
    const wayaPool = pools.find((pool) => !pool.isFinished && pool.poolId === 0)
    const withoutWayaPool = pools.filter((pool) => pool.poolId !== 0)

    const wayaAutoVault = wayaPool && {
      ...wayaPool,
      ...deserializedLockedWayaVault,
      vaultKey: VaultKey.WayaVault,
      userData: { ...wayaPool.userData, ...deserializedLockedWayaVault.userData },
    }

    const lockedVaultPosition = getVaultPosition(deserializedLockedWayaVault.userData)
    const hasFlexibleSharesStaked =
      deserializedFlexibleWayaVault?.userData && deserializedFlexibleWayaVault.userData.userShares.gt(0)

    const wayaAutoFlexibleVault =
      wayaPool && (lockedVaultPosition > VaultPosition.Flexible || hasFlexibleSharesStaked)
        ? [
            {
              ...wayaPool,
              ...deserializedFlexibleWayaVault,
              vaultKey: VaultKey.WayaFlexibleVault,
              userData: { ...wayaPool.userData, ...deserializedFlexibleWayaVault.userData },
            },
          ]
        : []

    const allPools = [...wayaAutoFlexibleVault, ...withoutWayaPool]
    if (wayaAutoVault) {
      allPools.unshift(wayaAutoVault)
    }
    return { pools: allPools, userDataLoaded }
  },
)

export const makeVaultPoolWithKeySelector = (vaultKey) =>
  createSelector(poolsWithVaultSelector, ({ pools }) => pools.find((p) => p.vaultKey === vaultKey))


