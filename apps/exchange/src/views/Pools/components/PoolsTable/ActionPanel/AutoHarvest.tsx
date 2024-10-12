import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import {
  BalanceWithLoading,
  Box,
  Flex,
  Heading,
  HelpIcon,
  Skeleton,
  Text,
  useMatchBreakpoints,
  useTooltip
} from '@plexswap/ui-plex'

import { styled } from 'styled-components'
import BN from 'bignumber.js'
import { useTranslation } from '@plexswap/localization'
import { Token } from '@plexswap/sdk-core'
import { useVaultApy } from 'hooks/useVaultApy'
import { useVaultPoolByKey } from 'state/pools/hooks'
import { DeserializedLockedWayaVault, VaultKey } from '@plexswap/pools'
import { VaultPosition, getVaultPosition } from 'utils/wayaPool'
import { getWayaVaultEarnings } from 'views/Pools/helpers'
import { useAccount } from 'wagmi'

import AutoEarningsBreakdown from '../../AutoEarningsBreakdown'
import useUserDataInVaultPresenter from '../../LockedPool/hooks/useUserDataInVaultPresenter'
import UnstakingFeeCountdownRow from '../../WayaVaultCard/UnstakingFeeCountdownRow'
import { ActionContainer, ActionContent, ActionTitles, RowActionContainer } from './styles'

const ZERO = new BN(0)

const HelpIconWrapper = styled.div`
align-self: center;
`

interface AutoHarvestActionProps {
pool: Pool.DeserializedPool<Token>
}

const AutoHarvestAction: React.FunctionComponent<React.PropsWithChildren<AutoHarvestActionProps>> = ({ pool }) => {
const { t } = useTranslation()
const { address: account } = useAccount()
const { isMobile } = useMatchBreakpoints()

const { earningTokenPrice, vaultKey, userDataLoaded } = pool
const vaultData = useVaultPoolByKey(pool.vaultKey)
const { userData, pricePerFullShare } = vaultData
const userShares = userData?.userShares
const wayaAtLastUserAction = userData?.wayaAtLastUserAction
const { hasAutoEarnings, autoWayaToDisplay, autoUsdToDisplay } = getWayaVaultEarnings(
  account,
  wayaAtLastUserAction || ZERO,
  userShares || ZERO,
  pricePerFullShare || ZERO,
  earningTokenPrice || 0,
  vaultKey === VaultKey.WayaVault
    ? (vaultData as DeserializedLockedWayaVault).userData?.currentPerformanceFee
        .plus((vaultData as DeserializedLockedWayaVault).userData?.currentOverdueFee || ZERO)
        .plus((vaultData as DeserializedLockedWayaVault).userData?.userBoostedShare || ZERO)
    : undefined,
)

const { secondDuration, weekDuration } = useUserDataInVaultPresenter({
  lockStartTime:
    vaultKey === VaultKey.WayaVault ? (vaultData as DeserializedLockedWayaVault).userData?.lockStartTime ?? '0' : '0',
  lockEndTime:
    vaultKey === VaultKey.WayaVault ? (vaultData as DeserializedLockedWayaVault).userData?.lockEndTime ?? '0' : '0',
})

const { boostFactor } = useVaultApy({ duration: secondDuration })

const vaultPosition = getVaultPosition(vaultData.userData)

const {
  targetRef: tagTargetRefOfRecentProfit,
  tooltip: tagTooltipOfRecentProfit,
  tooltipVisible: tagTooltipVisibleOfRecentProfit,
} = useTooltip(<AutoEarningsBreakdown pool={pool} account={account} />, {
  placement: 'bottom',
})

const actionTitle = (
  <Text fontSize="12px" bold color="secondary" as="span" textTransform="uppercase">
    {t('Recent WAYA profit')}
  </Text>
)

if (!account) {
  return (
    <ActionContainer>
      <ActionTitles>{actionTitle}</ActionTitles>
      <ActionContent>
        <Heading>0</Heading>
      </ActionContent>
    </ActionContainer>
  )
}

if (!userDataLoaded) {
  return (
    <ActionContainer>
      <ActionTitles>{actionTitle}</ActionTitles>
      <ActionContent>
        <Skeleton width={180} height="32px" marginTop={14} />
      </ActionContent>
    </ActionContainer>
  )
}

return (
  <RowActionContainer style={{ flexDirection: 'column', flex: 1 }}>
    <Flex justifyContent="space-between">
      <Box width="100%">
        <ActionTitles>{actionTitle}</ActionTitles>
        <ActionContent>
          <Flex flex="1" flexDirection="column" alignSelf="flex-start">
            <>
              {hasAutoEarnings ? (
                <>
                  <Flex>
                    <BalanceWithLoading lineHeight="1" bold fontSize="20px" decimals={5} value={autoWayaToDisplay} />
                    {tagTooltipVisibleOfRecentProfit && tagTooltipOfRecentProfit}
                    <HelpIconWrapper ref={tagTargetRefOfRecentProfit}>
                      <HelpIcon ml="4px" color="textSubtle" />
                    </HelpIconWrapper>
                  </Flex>
                  {Number.isFinite(earningTokenPrice) && earningTokenPrice !== undefined && earningTokenPrice > 0 && (
                    <BalanceWithLoading
                      display="inline"
                      fontSize="12px"
                      color="textSubtle"
                      decimals={2}
                      prefix="~"
                      value={autoUsdToDisplay}
                      unit=" USD"
                    />
                  )}
                </>
              ) : (
                <>
                  <Heading color="textDisabled">0</Heading>
                  <Text fontSize="12px" color="textDisabled">
                    0 USD
                  </Text>
                </>
              )}
            </>
          </Flex>
          <Flex flex="1.3" flexDirection="column" alignSelf="flex-start" alignItems="flex-start">
            {[VaultPosition.Flexible, VaultPosition.None].includes(vaultPosition) && (
              <UnstakingFeeCountdownRow vaultKey={vaultKey} isTableVariant />
            )}
          </Flex>
        </ActionContent>
      </Box>
      {!isMobile && vaultKey === VaultKey.WayaVault && (vaultData as DeserializedLockedWayaVault).userData?.locked && (
        <Box minWidth="123px">
          <ActionTitles>
            <Text fontSize="12px" bold color="secondary" as="span" textTransform="uppercase">
              {t('Yield boost')}
            </Text>
          </ActionTitles>
          <ActionContent>
            <Flex flex="1" flexDirection="column" alignSelf="flex-start">
              <BalanceWithLoading
                color="text"
                lineHeight="1"
                bold
                fontSize="20px"
                value={boostFactor ? boostFactor?.toString() : '0'}
                decimals={2}
                unit="x"
              />
              <Text fontSize="12px" color="textSubtle">
                {t('Lock for %duration%', { duration: weekDuration })}
              </Text>
            </Flex>
          </ActionContent>
        </Box>
      )}
    </Flex>
  </RowActionContainer>
)
}

export default AutoHarvestAction