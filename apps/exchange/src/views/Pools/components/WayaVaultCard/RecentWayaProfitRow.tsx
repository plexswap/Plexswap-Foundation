import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { Flex, Text } from '@plexswap/ui-plex'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { useTranslation } from '@plexswap/localization'
import { Token } from '@plexswap/sdk-core'
import { DeserializedLockedVaultUser, VaultKey } from '@plexswap/pools'
import { useWayaPrice } from 'hooks/useWayaPrice'
import { useVaultPoolByKey } from 'state/pools/hooks'
import { getWayaVaultEarnings } from 'views/Pools/helpers'
import { useAccount } from 'wagmi'
import RecentWayaProfitBalance from './RecentWayaProfitBalance'

const RecentWayaProfitCountdownRow = ({ pool }: { pool: Pool.DeserializedPool<Token> }) => {
  const { t } = useTranslation()
  const { address: account } = useAccount()
  const { pricePerFullShare, userData } = useVaultPoolByKey(pool.vaultKey)
  const wayaPrice = useWayaPrice()
  const { hasAutoEarnings, autoWayaToDisplay } = getWayaVaultEarnings(
    account,
  userData?.wayaAtLastUserAction || BIG_ZERO,
    userData?.userShares || BIG_ZERO,
    pricePerFullShare || BIG_ZERO,
    wayaPrice.toNumber(),
    pool.vaultKey === VaultKey.WayaVault
      ? (userData as DeserializedLockedVaultUser).currentPerformanceFee.plus(
          (userData as DeserializedLockedVaultUser).currentOverdueFee,
        )
      : undefined,
  )

  if (!(userData?.userShares.gt(0) && account)) {
    return null
  }

  return (
    <Flex alignItems="center" justifyContent="space-between">
      <Text fontSize="14px">{`${t('Recent WAYA profit')}:`}</Text>
      {hasAutoEarnings && <RecentWayaProfitBalance wayaToDisplay={autoWayaToDisplay} pool={pool} account={account} />}
    </Flex>
  )
}

export default RecentWayaProfitCountdownRow
