import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { Box, Text } from '@plexswap/ui-plex'
import { useTranslation } from '@plexswap/localization'
import { Token } from '@plexswap/sdk-core'
import { getBalanceNumber } from '@plexswap/utils/formatBalance'
import { useVaultPoolByKey } from 'state/pools/hooks'

interface OriginalLockedInfoProps {
  pool?: Pool.DeserializedPool<Token>
}

const OriginalLockedInfo: React.FC<React.PropsWithChildren<OriginalLockedInfoProps>> = ({ pool }) => {
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation()

  const { userData } = useVaultPoolByKey(pool?.vaultKey)

  const originalLockedAmount = getBalanceNumber(userData?.lockedAmount)
  const originalUsdValue = getBalanceNumber(
    userData?.lockedAmount.multipliedBy(pool?.stakingTokenPrice ?? 0),
    pool?.stakingToken.decimals,
  )
  const originalLockedAmountText = originalLockedAmount > 0.01 ? originalLockedAmount.toFixed(2) : '<0.01'
  const originalUsdValueText = originalUsdValue > 0.01 ? `~${originalUsdValue.toFixed(2)}` : '<0.01'
  const lastActionInMs = userData?.lastUserActionTime ? parseInt(userData?.lastUserActionTime) * 1000 : 0

  return (
    <>
      <Text>
        {t(
          'Includes both the original staked amount and rewards earned since the last deposit, withdraw, extend or convert action.',
        )}
      </Text>
      <Box mt="12px">
        <Text>{t('Original locked amount')}:</Text>
        <Text bold>{`${originalLockedAmountText} WAYA (${originalUsdValueText} USD)`}</Text>
      </Box>
      <Box mt="12px">
        <Text>{t('Last action')}:</Text>
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
      </Box>
    </>
  )
}

export default OriginalLockedInfo
