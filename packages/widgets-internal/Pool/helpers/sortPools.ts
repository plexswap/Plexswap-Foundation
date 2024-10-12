import { formatUnits } from "viem";
import orderBy from "lodash/orderBy";
import { DeserializedPool, DeserializedPoolLockedVault, DeserializedPoolVault, VaultKey } from "../types";
import { getWayaVaultEarnings } from "./getWayaVaultEarnings";

export function sortPools<T>(account: string, sortOption: string, poolsToSort: DeserializedPool<T>[]) {
  switch (sortOption) {
    case "apr":
      // Ternary is needed to prevent pools without APR (like MIX) getting top spot
      return orderBy(poolsToSort, (pool: DeserializedPool<T>) => (pool.apr ? pool.apr : 0), "desc");
    case "earned":
      return orderBy(
        poolsToSort,
        (pool: DeserializedPool<T>) => {
          if (!pool.userData || !pool.earningTokenPrice) {
            return 0;
          }

          if (pool.vaultKey) {
            const { userData, pricePerFullShare } = pool as DeserializedPoolVault<T>;
            if (!userData || !userData.userShares) {
              return 0;
            }
            return getWayaVaultEarnings(
              account,
              userData.wayaAtLastUserAction,
              userData.userShares,
              pricePerFullShare,
              pool.earningTokenPrice,
              pool.vaultKey === VaultKey.WayaVault
                ? (pool as DeserializedPoolLockedVault<T>)?.userData?.currentPerformanceFee?.plus(
                    (pool as DeserializedPoolLockedVault<T>)?.userData?.currentOverdueFee || 0
                  )
                : undefined
            ).autoUsdToDisplay;
          }
          return pool.userData.pendingReward.times(pool.earningTokenPrice).toNumber();
        },
        "desc"
      );
    case "totalStaked": {
      return orderBy(
        poolsToSort,
        (pool: DeserializedPool<T>) => {
          let totalStaked = Number.NaN;
          if (pool.vaultKey) {
            const vault = pool as DeserializedPoolVault<T>;
            if (pool.stakingTokenPrice && vault?.totalWayaInVault?.isFinite()) {
              totalStaked =
                +formatUnits(BigInt(vault.totalWayaInVault.toString()), pool?.stakingToken?.decimals) *
                pool.stakingTokenPrice;
            }
          } else if (pool.totalStaked?.isFinite() && pool.stakingTokenPrice) {
            totalStaked =
              +formatUnits(BigInt(pool.totalStaked.toString()), pool?.stakingToken?.decimals) * pool.stakingTokenPrice;
          }
          return Number.isFinite(totalStaked) ? totalStaked : 0;
        },
        "desc"
      );
    }
    case "latest":
      return orderBy(poolsToSort, (pool: DeserializedPool<T>) => Number(pool.poolId), "desc");
    default:
      return poolsToSort;
  }
}
