import { Flex, ModalCore } from '@plexswap/ui-plex'
import { formatBigInt } from '@plexswap/utils/formatBalance'
import { FarmWidget } from '@plexswap/widgets-internal'
import { BigNumber } from 'bignumber.js'
import { TokenPairImage } from 'components/TokenImage'
import { useWayaPrice } from 'hooks/useWayaPrice'
import { useCallback, useMemo, useState } from 'react'
import { ExtendedFarm } from 'views/Farms/FarmsExtended'
import FarmExtendedCardList from 'views/Farms/components/FarmCard/Extended/FarmExtendedCardList'
import { useGlobalFarmsBatchHarvest } from 'views/Farms/hooks/extended/useFarmExtendedActions'

const { AvailableFarming, TotalStakedBalance, ViewAllFarmModal } = FarmWidget.FarmExtendedCard

interface FarmInfoProps {
  farm: ExtendedFarm
  isReady: boolean
  onAddLiquidity: () => void
}

const FarmInfo: React.FunctionComponent<React.PropsWithChildren<FarmInfoProps>> = ({
  farm,
  isReady,
  onAddLiquidity,
}) => {
  const wayaPrice = useWayaPrice()
  const [show, setShow] = useState(false)

  const inactive = farm.multiplier === '0X'

  const { lpSymbol, token, quoteToken, multiplier, stakedPositions, unstakedPositions, pendingWayaByTokenIds } = farm

  const onlyOnePosition = useMemo(
    () => new BigNumber(stakedPositions.length).plus(unstakedPositions.length).eq(1),
    [stakedPositions, unstakedPositions],
  )

  const hasEarningTokenIds = useMemo(
    () =>
      Object.entries(pendingWayaByTokenIds)
        .filter(([, value]) => value > 0)
        .map(([key]) => key),
    [pendingWayaByTokenIds],
  )

  const totalEarnings = useMemo(
    () =>
      +formatBigInt(
        Object.values(pendingWayaByTokenIds).reduce((total, vault) => total + vault, 0n),
        4,
      ),
    [pendingWayaByTokenIds],
  )

  const { harvesting, onHarvestAll } = useGlobalFarmsBatchHarvest()

  const earningsBusd = useMemo(
    () => new BigNumber(totalEarnings).times(wayaPrice).toNumber(),
    [wayaPrice, totalEarnings],
  )

  const handleDismiss = useCallback(() => setShow(false), [])

  return (
    <Flex flexDirection="column">
      {onlyOnePosition ? (
        <FarmExtendedCardList farm={farm} />
      ) : (
        <>
          {!inactive && unstakedPositions.length > 0 && (
            <AvailableFarming
              lpSymbol={lpSymbol}
              unstakedPositions={unstakedPositions}
              onClickViewAllButton={() => {
                setShow(true)
                setTimeout(() => {
                  document.getElementById(`${farm.pid}-farm-extended-available`)?.scrollIntoView()
                })
              }}
            />
          )}
          {stakedPositions.length > 0 && (
            <TotalStakedBalance
              stakedPositions={stakedPositions}
              earnings={totalEarnings}
              earningsBusd={earningsBusd}
              onClickViewAllButton={() => {
                setShow(true)
                setTimeout(() => {
                  document.getElementById(`${farm.pid}-farm-extended-staking`)?.scrollIntoView()
                })
              }}
            />
          )}
        </>
      )}
      <ModalCore isOpen={show} onDismiss={handleDismiss} closeOnOverlayClick>
        <ViewAllFarmModal
          title={lpSymbol}
          isReady={isReady}
          lpSymbol={lpSymbol}
          multiplier={multiplier}
          boosted={farm.boosted}
          feeAmount={farm.feeAmount}
          onAddLiquidity={onAddLiquidity}
          tokenPairImage={
            <TokenPairImage
              variant="inverted"
              primaryToken={token}
              secondaryToken={quoteToken}
              width={32}
              height={32}
            />
          }
          onHarvestAll={hasEarningTokenIds.length > 1 ? () => onHarvestAll(hasEarningTokenIds) : undefined}
          harvesting={harvesting}
          onDismiss={() => setShow(false)}
        >
          <Flex flexDirection="column">
            <FarmExtendedCardList farm={farm} onDismiss={() => setShow(false)} harvesting={harvesting} />
          </Flex>
        </ViewAllFarmModal>
      </ModalCore>
    </Flex>
  )
}

export default FarmInfo
