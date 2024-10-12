import { useVaultPoolByKey } from 'state/pools/hooks'
import { DeserializedLockedWayaVault, VaultKey } from '@plexswap/pools'

export const useUserLockedWayaStatus = () => {
  const vaultPool = useVaultPoolByKey(VaultKey.WayaVault) as DeserializedLockedWayaVault

  return {
    totalWayaInVault: vaultPool?.totalWayaInVault,
    totalLockedAmount: vaultPool?.totalLockedAmount,
    isLoading: vaultPool?.userData?.isLoading,
    locked: Boolean(vaultPool?.userData?.locked),
    lockedEnd: vaultPool?.userData?.lockEndTime,
    lockedAmount: vaultPool?.userData?.lockedAmount,
    lockBalance: vaultPool?.userData?.balance,
    lockedStart: vaultPool?.userData?.lockStartTime,
  }
}
