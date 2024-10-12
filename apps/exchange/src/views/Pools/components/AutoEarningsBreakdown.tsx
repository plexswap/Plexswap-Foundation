import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { Box, Text } from '@plexswap/ui-plex'
import { useTranslation } from '@plexswap/localization'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { Token } from '@plexswap/sdk-core'
import dayjs from 'dayjs'
import { useVaultPoolByKey } from 'state/pools/hooks'
import { VaultKey, DeserializedLockedVaultUser } from '@plexswap/pools'
import { getWayaVaultEarnings } from '../helpers'

interface AutoEarningsBreakdownProps {
  pool: Pool.DeserializedPool<Token>
  account?: string
}

const AutoEarningsBreakdown: React.FC<React.PropsWithChildren<AutoEarningsBreakdownProps>> = ({ pool, account }) => {
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation()
  const { earningTokenPrice } = pool
  const { pricePerFullShare, userData } = useVaultPoolByKey(pool.vaultKey)
  const { autoWayaToDisplay, autoUsdToDisplay } = getWayaVaultEarnings(
    account,
    userData?.wayaAtLastUserAction || BIG_ZERO,
    userData?.userShares || BIG_ZERO,
    pricePerFullShare || BIG_ZERO,
    earningTokenPrice || 0,
    pool.vaultKey === VaultKey.WayaVault
      ? (userData as DeserializedLockedVaultUser).currentPerformanceFee
          .plus((userData as DeserializedLockedVaultUser).currentOverdueFee)
          .plus((userData as DeserializedLockedVaultUser).userBoostedShare)
      : undefined,
  )

  const lastActionInMs = userData?.lastUserActionTime ? parseInt(userData.lastUserActionTime) * 1000 : 0
  const hourDiffSinceLastAction = dayjs().diff(dayjs(lastActionInMs), 'hours')
  const earnedWayaPerHour = hourDiffSinceLastAction ? autoWayaToDisplay / hourDiffSinceLastAction : 0
  const earnedUsdPerHour = hourDiffSinceLastAction ? autoUsdToDisplay / hourDiffSinceLastAction : 0

  return (
    <>
      <Text>{t('Earned since your last action')}:</Text>
      <Text bold>
        {new Date(lastActionInMs).toLocaleString(locale, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </Text>
      {hourDiffSinceLastAction ? (
        <Box mt="12px">
          <Text>{t('Hourly Average')}:</Text>
          <Text bold>
            {earnedWayaPerHour < 0.01 ? '<0.01' : earnedWayaPerHour.toFixed(2)} WAYA
            <Text display="inline-block" ml="5px">
              ({earnedUsdPerHour < 0.01 ? '<0.01' : `~${earnedUsdPerHour.toFixed(2)}`} USD)
            </Text>
          </Text>
        </Box>
      ) : null}
      <Box mt="12px">
        <Text>
          {t(
            '*Please note that any deposit, withdraw, extend or convert action will combine earned rewards with the original staked amount. Resetting this number to 0.',
          )}
        </Text>
      </Box>
    </>
  )
}

export default AutoEarningsBreakdown
