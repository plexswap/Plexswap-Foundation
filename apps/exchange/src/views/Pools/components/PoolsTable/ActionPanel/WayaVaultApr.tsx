import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { Balance, Box, Button, CalculateIcon, Flex, Skeleton, Text, useModal } from '@plexswap/ui-plex'
import { useTranslation } from '@plexswap/localization'
import { MAX_LOCK_DURATION, DeserializedLockedVaultUser, DeserializedVaultUser, VaultKey } from '@plexswap/pools'
import { Token } from '@plexswap/sdk-core'
import { useVaultApy } from 'hooks/useVaultApy'
import { VaultPosition } from 'utils/wayaPool'
import { VaultRoiCalculatorModal } from '../../Vault/VaultRoiCalculatorModal'

interface WayaVaultAprProps {
  pool: Pool.DeserializedPool<Token>
  userData: DeserializedVaultUser
  vaultPosition: VaultPosition
}

const WayaVaultApr: React.FC<React.PropsWithChildren<WayaVaultAprProps>> = ({ pool, userData, vaultPosition }) => {
  const { t } = useTranslation()

  const { flexibleApy, lockedApy } = useVaultApy({
    duration:
      vaultPosition > VaultPosition.Flexible
        ? +(userData as DeserializedLockedVaultUser).lockEndTime -
          +(userData as DeserializedLockedVaultUser).lockStartTime
        : MAX_LOCK_DURATION,
  })

  const [onPresentFlexibleApyModal] = useModal(<VaultRoiCalculatorModal pool={pool} />)
  const [onPresentLockedApyModal] = useModal(<VaultRoiCalculatorModal pool={pool} initialView={1} />)

  return (
    <>
      <Box marginX="8px" mb="8px">
        <Flex justifyContent="space-between">
          <Text fontSize="16px" color="textSubtle" textAlign="left">
            {t('Flexible APY')}
          </Text>
          {flexibleApy ? (
            <Flex alignItems="center" justifyContent="flex-start">
              <Balance fontSize="16px" value={parseFloat(flexibleApy)} decimals={2} unit="%" fontWeight="600" />
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onPresentFlexibleApyModal()
                }}
                variant="text"
                width="20px"
                height="20px"
                padding="0px"
                marginLeft="4px"
              >
                <CalculateIcon color="textSubtle" width="20px" />
              </Button>
            </Flex>
          ) : (
            <Skeleton width="80px" height="16px" />
          )}
        </Flex>
      </Box>
      {pool.vaultKey === VaultKey.WayaVault && (
        <Box marginX="8px" mb="8px">
          <Flex justifyContent="space-between">
            <Text fontSize="16px" color="textSubtle" textAlign="left">
              {t('Locked APR')}
            </Text>
            {lockedApy ? (
              <Flex alignItems="center" justifyContent="flex-start">
                <Text fontSize="16px" style={{ whiteSpace: 'nowrap' }} fontWeight="600">
                  {t('Up to')}
                </Text>
                <Balance
                  ml="7px"
                  fontSize="16px"
                  value={parseFloat(lockedApy)}
                  decimals={2}
                  unit="%"
                  fontWeight="600"
                />
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPresentLockedApyModal()
                  }}
                  variant="text"
                  width="20px"
                  height="20px"
                  padding="0px"
                  marginLeft="4px"
                >
                  <CalculateIcon color="textSubtle" width="20px" />
                </Button>
              </Flex>
            ) : (
              <Skeleton width="80px" height="16px" />
            )}
          </Flex>
        </Box>
      )}
    </>
  )
}

export default WayaVaultApr
