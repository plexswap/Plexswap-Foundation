import type {
  DeserializedLockedVaultUser,
  DeserializedLockedWayaVault,
  DeserializedPool,
  DeserializedPoolConfig,
  DeserializedPoolLockedVault,
  DeserializedPoolVault,
  DeserializedVaultFees,
  DeserializedVaultUser,
  DeserializedWayaVault,
  PoolCategory,
  PoolConfigBaseProps,
  SerializedPoolConfig,
  SerializedVaultFees,
} from "@plexswap/pools";

import { VaultKey } from "@plexswap/pools";
import BigNumber from "bignumber.js";

export {
  DeserializedLockedVaultUser,
  DeserializedLockedWayaVault,
  DeserializedPool,
  DeserializedPoolConfig,
  DeserializedPoolLockedVault,
  DeserializedPoolVault,
  DeserializedVaultFees,
  DeserializedVaultUser,
  DeserializedWayaVault,
  PoolCategory,
  PoolConfigBaseProps,
  SerializedPoolConfig,
  SerializedVaultFees,
  VaultKey,
};

export interface HarvestActionsProps {
  earnings: BigNumber;
  isLoading?: boolean;
  onPresentCollect: any;
  earningTokenPrice: number;
  earningTokenBalance: number;
  earningTokenDollarBalance: number;
}
