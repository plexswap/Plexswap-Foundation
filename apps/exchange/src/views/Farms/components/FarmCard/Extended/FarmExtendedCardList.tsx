import { useTranslation } from '@plexswap/localization'
import { AutoRenewIcon, AutoRow, Box, Button, Flex, PreTitle, Text } from '@plexswap/ui-plex'
import { isPositionOutOfRange } from '@plexswap/utils/isPositionOutOfRange'
import { usePool } from 'hooks/extended/usePools'
import partition_ from 'lodash/partition'
import { useCallback } from 'react'
import { ExtendedFarm } from 'views/Farms/FarmsExtended'
import SingleFarmExtendedCard from 'views/Farms/components/FarmCard/Extended/SingleFarmExtendedCard'
import { useGlobalFarmsBatchHarvest } from 'views/Farms/hooks/extended/useFarmExtendedActions'

interface FarmExtendedCardListProps {
  farm: ExtendedFarm
  harvesting?: boolean
  direction?: 'row' | 'column'
  onDismiss?: () => void
  showHarvestAll?: boolean
}

const FarmExtendedCardList: React.FunctionComponent<React.PropsWithChildren<FarmExtendedCardListProps>> = ({
  farm,
  onDismiss,
  direction,
  harvesting,
  showHarvestAll,
}) => {
  const { t } = useTranslation()
  const { onHarvestAll, harvesting: extendedBatchHarvesting } = useGlobalFarmsBatchHarvest()
  const { stakedPositions, unstakedPositions, lpSymbol, token, quoteToken, pendingWayaByTokenIds, multiplier } = farm
  const [, pool] = usePool(farm.token, farm.quoteToken, farm.feeAmount)

  const harvestAllFarms = useCallback(async () => {
    onHarvestAll(stakedPositions.map((value) => value.tokenId.toString()))
  }, [onHarvestAll, stakedPositions])

  return (
    <Box width="100%">
      {multiplier !== '0X' && unstakedPositions.length > 0 && (
        <Flex flexDirection="column" width="100%" mb="24px" id={`${farm.pid}-farm-extended-available`}>
          <PreTitle fontSize="12px" color="textSubtle" m="0 0 8px 0">
            {t('%totalAvailableFarm% LP Available for Farming', { totalAvailableFarm: unstakedPositions.length })}
          </PreTitle>
          <AutoRow width="100%" gap="16px" flexDirection="column" alignItems="flex-start">
            {partition_(unstakedPositions, (position) => !isPositionOutOfRange(pool?.tickCurrent, position))
              .flat()
              .map((position) => (
                <>
                  <SingleFarmExtendedCard
                    farm={farm}
                    style={{
                      minWidth: '49%',
                      width: '100%',
                    }}
                    pool={pool ?? undefined}
                    flex={1}
                    direction={direction}
                    positionType="unstaked"
                    key={position.tokenId.toString()}
                    lpSymbol={lpSymbol}
                    position={position}
                    token={token}
                    quoteToken={quoteToken}
                    pendingWayaByTokenIds={pendingWayaByTokenIds}
                    onDismiss={onDismiss}
                  />
                </>
              ))}
          </AutoRow>
        </Flex>
      )}
      {stakedPositions.length > 0 && (
        <Flex flexDirection="column" width="100%" mb="24px" id={`${farm.pid}-farm-extended-staking`}>
          <PreTitle color="textSubtle" m="0 0 8px 0">
            {t('%totalStakedFarm% Staked Farming', { totalStakedFarm: stakedPositions.length })}
          </PreTitle>
          <Flex flexWrap="wrap" width="100%">
            {stakedPositions.map((position) => (
              <>
                <SingleFarmExtendedCard
                  harvesting={harvesting}
                  pool={pool ?? undefined}
                  width="100%"
                  direction={direction}
                  positionType="staked"
                  farm={farm}
                  key={position.tokenId.toString()}
                  lpSymbol={lpSymbol}
                  position={position}
                  token={token}
                  quoteToken={quoteToken}
                  pendingWayaByTokenIds={pendingWayaByTokenIds}
                  onDismiss={onDismiss}
                />
              </>
            ))}
            {showHarvestAll && stakedPositions.length > 1 && (
              <Button
                width="100%"
                id="harvest-all"
                isLoading={extendedBatchHarvesting}
                endIcon={extendedBatchHarvesting ? <AutoRenewIcon spin color="currentColor" /> : null}
                disabled={extendedBatchHarvesting}
                onClick={harvestAllFarms}
              >
                <Text color="invertedContrast" bold>
                  {extendedBatchHarvesting ? t('Harvesting') : t('Harvest all')}
                </Text>
              </Button>
            )}
          </Flex>
        </Flex>
      )}
    </Box>
  )
}

export default FarmExtendedCardList
