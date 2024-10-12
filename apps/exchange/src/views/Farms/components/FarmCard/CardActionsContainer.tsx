import { FarmWithStakedValue } from '@plexswap/farms'
import { useTranslation } from '@plexswap/localization'
import { AtomBox, Button, Flex, RowBetween, Skeleton, Text } from '@plexswap/ui-plex'
import ConnectWalletButton from 'components/ConnectWalletButton'

import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { styled, useTheme } from 'styled-components'
import { StatusView } from 'views/Farms/components/YieldBooster/components/Extended/StatusView'
import { StatusViewButtons } from 'views/Farms/components/YieldBooster/components/Extended/StatusViewButtons'
import { useBoostStatusPM } from 'views/Farms/components/YieldBooster/hooks/Extended/useBoostStatus'
import { useWayaBoostLimitAndLockInfo } from 'views/Farms/components/YieldBooster/hooks/Extended/useWayaExtendedInfo'
import { useWrapperBooster } from 'views/PositionManagers/hooks/useWrapperBooster'
import { useUpdateWayaFarms } from '../../hooks/useUpdateWaya'
import { HarvestActionContainer } from '../FarmTable/Actions/HarvestAction'
import { StakedContainer } from '../FarmTable/Actions/StakedAction'
import HarvestAction from './HarvestAction'
import StakeAction from './StakeAction'

export const ActionContainer = styled(Flex)`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.input};
  border-radius: 16px;
  flex-grow: 1;
  flex-basis: 0;
  margin-bottom: 8px;
  flex-wrap: wrap;
  padding: 16px;
  gap: 24px;
`

export const Title = styled.div`
  color: ${({ theme }) => theme.colors.textSubtle};
  font-feature-settings: 'liga' off;
  font-family: Kanit;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%; /* 14.4px */
  letter-spacing: 0.36px;
  text-transform: uppercase;
`

interface FarmCardActionsProps {
  farm: FarmWithStakedValue
  account?: string
  addLiquidityUrl?: string
  lpLabel?: string
  displayApr?: string | null
  boosterMultiplier?: number
}

const CardActions: React.FC<React.PropsWithChildren<FarmCardActionsProps>> = ({
  farm,
  account,
  addLiquidityUrl,
  lpLabel,
  displayApr,
  boosterMultiplier = 1,
}) => {
  const { t } = useTranslation()
  const { pid, token, quoteToken, vaultPid, lpSymbol, wayaWrapperAddress, wayaUserData } = farm

  const isReady = farm.multiplier !== undefined
  const isBooster = Boolean(wayaWrapperAddress) && farm?.wayaPublicData?.isRewardInRange
  const { earnings } = (isBooster ? farm.wayaUserData : farm.userData) || {}
  const { status } = useBoostStatusPM(isBooster, boosterMultiplier)
  const { colors } = useTheme()
  const dividerBorderStyle = useMemo(() => `1px solid ${colors.input}`, [colors.input])
  const { shouldUpdate, voterUserMultiplierBeforeBoosted } = useWrapperBooster(
    farm.wayaUserData?.boosterContractAddress ?? '0x',
    boosterMultiplier ?? 1,
    wayaWrapperAddress,
  )
  const { onUpdate } = useUpdateWayaFarms(wayaWrapperAddress ?? '0x', pid)
  const { locked } = useWayaBoostLimitAndLockInfo()
  const router = useRouter()
  const isHistory = useMemo(() => router.pathname.includes('history'), [router])

  return (
    <AtomBox mt="16px">
      <ActionContainer bg="background" flexDirection="column">
        {!isReady && <Skeleton width={80} height={18} mb="4px" />}
        {!account ? (
          <RowBetween flexDirection="column" alignItems="flex-start" flex={1} width="100%">
            <Title>{t('Start Earning')}</Title>
            <ConnectWalletButton mt="8px" width="100%" />
          </RowBetween>
        ) : (
          <>
            <RowBetween flexDirection="column" alignItems="flex-start" flex={1} width="100%">
              <Flex>
                <Text bold textTransform="uppercase" color="secondary" fontSize="12px" pr="4px">
                  {lpSymbol}
                </Text>
                <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
                  {t('Staked')}
                </Text>
              </Flex>
              <StakedContainer {...farm} lpLabel={lpLabel} addLiquidityUrl={addLiquidityUrl} displayApr={displayApr}>
                {(props) => <StakeAction {...props} />}
              </StakedContainer>
            </RowBetween>
            <AtomBox
              width={{
                xs: '100%',
                md: 'auto',
              }}
              style={{ borderLeft: dividerBorderStyle, borderTop: dividerBorderStyle }}
            />
            <RowBetween flexDirection="column" alignItems="flex-start" flex={1} width="100%">
              <Flex>
                <Text bold textTransform="uppercase" color="secondary" fontSize="12px" pr="4px">
                  WAYA
                </Text>
                <Text bold textTransform="uppercase" color="textSubtle" fontSize="12px">
                  {t('Earned')}
                </Text>
              </Flex>
              <HarvestActionContainer
                earnings={earnings}
                pid={pid}
                vaultPid={vaultPid}
                token={token}
                quoteToken={quoteToken}
                lpSymbol={lpSymbol}
                wayaWrapperAddress={wayaWrapperAddress}
                wayaUserData={wayaUserData}
              >
                {(props) => <HarvestAction {...props} />}
              </HarvestActionContainer>
            </RowBetween>
          </>
        )}
        {isBooster && !isHistory && (
          <>
            <AtomBox
              width={{
                xs: '100%',
                md: 'auto',
              }}
              style={{ borderLeft: dividerBorderStyle, borderTop: dividerBorderStyle }}
            />
            <RowBetween flexDirection="column" alignItems="flex-start" flex={1} width="100%">
              <Flex width="100%" justifyContent="space-between" alignItems="center">
                <StatusView
                  status={status}
                  isFarmStaking={farm?.wayaUserData?.stakedBalance?.gt(0)}
                  boostedMultiplier={boosterMultiplier}
                  maxBoostMultiplier={2.5}
                  shouldUpdate={shouldUpdate && farm?.wayaUserData?.stakedBalance?.gt(0)}
                  expectMultiplier={voterUserMultiplierBeforeBoosted}
                />
                <StatusViewButtons
                  locked={locked}
                  updateButton={
                    shouldUpdate && farm?.wayaUserData?.stakedBalance?.gt(0) ? (
                      <Button onClick={onUpdate}>{t('Update')}</Button>
                    ) : null
                  }
                />
              </Flex>
            </RowBetween>
          </>
        )}
      </ActionContainer>
    </AtomBox>
  )
}

export default CardActions
