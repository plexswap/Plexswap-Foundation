import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { Balance, Button, CalculateIcon, Flex, FlexGap, Skeleton, Text, useModal } from '@plexswap/ui-plex'
import { useTranslation } from '@plexswap/localization'
import { Token } from '@plexswap/sdk-core'
import { LightGreyCard } from 'components/Card'
import { useVaultApy } from 'hooks/useVaultApy'
import { memo } from 'react'
import { VaultKey } from '@plexswap/pools'
import { styled } from 'styled-components'
import { VaultRoiCalculatorModal } from '../Vault/VaultRoiCalculatorModal'

const AprLabelContainer = styled(Flex)`
  &:hover {
    opacity: 0.5;
  }
`

export const StakingApy = memo(({ pool }: { pool: Pool.DeserializedPool<Token> }) => {
  const { t } = useTranslation()

  const { flexibleApy, lockedApy } = useVaultApy()

  const [onPresentFlexibleApyModal] = useModal(<VaultRoiCalculatorModal pool={pool} />)

  const [onPresentLockedApyModal] = useModal(<VaultRoiCalculatorModal pool={pool} initialView={1} />)

  return (
    <LightGreyCard>
      <Flex alignItems="center" justifyContent="space-between">
        <Text color="textSubtle" textTransform="uppercase" bold fontSize="12px">
          {t('Flexible')} APY:
        </Text>
        {flexibleApy ? (
          <AprLabelContainer alignItems="center" justifyContent="flex-start">
            <Balance fontSize="16px" value={parseFloat(flexibleApy)} decimals={2} unit="%" bold />
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
          </AprLabelContainer>
        ) : (
          <Skeleton width="80px" height="16px" />
        )}
      </Flex>
      {pool.vaultKey === VaultKey.WayaVault && (
        <Flex alignItems="center" justifyContent="space-between">
          <Text color="textSubtle" textTransform="uppercase" bold fontSize="12px">
            {t('Locked')} APR:
          </Text>
          {lockedApy ? (
            <FlexGap gap="4px" flexWrap="wrap" justifyContent="flex-end">
              <Text style={{ whiteSpace: 'nowrap' }} bold>
                {t('Up to')}
              </Text>
              <AprLabelContainer alignItems="center">
                <Balance fontSize="16px" value={parseFloat(lockedApy)} decimals={2} unit="%" bold />
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
              </AprLabelContainer>
            </FlexGap>
          ) : (
            <Skeleton width="80px" height="16px" />
          )}
        </Flex>
      )}
    </LightGreyCard>
  )
})
