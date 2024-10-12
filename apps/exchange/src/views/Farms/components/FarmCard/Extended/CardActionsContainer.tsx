import { useModalCore } from '@plexswap/ui-plex'
import { FarmWidget } from '@plexswap/widgets-internal'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { useMemo } from 'react'
import { styled } from 'styled-components'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { AddLiquidityExtendedModal } from 'views/AddLiquidityExtended/Modal'
import { ExtendedFarm } from 'views/Farms/FarmsExtended'
import FarmInfo from './FarmInfo'

const { NoPosition } = FarmWidget.FarmExtendedCard

const Action = styled.div`
  padding-top: 16px;
`

interface FarmCardActionsProps {
  farm: ExtendedFarm
  account?: string
  lpLabel?: string
}

const CardActions: React.FC<React.PropsWithChildren<FarmCardActionsProps>> = ({ farm, account }) => {
  const { multiplier, stakedPositions, unstakedPositions } = farm
  const isReady = multiplier !== undefined
  const inactive = isReady && multiplier === '0X'

  const hasNoPosition = useMemo(
    () => stakedPositions.length === 0 && unstakedPositions.length === 0,
    [stakedPositions, unstakedPositions],
  )

  const addLiquidityModal = useModalCore()

  return (
    <Action>
      <AddLiquidityExtendedModal
        {...addLiquidityModal}
        currency0={unwrappedToken(farm.token)}
        currency1={unwrappedToken(farm.quoteToken)}
        feeAmount={farm.feeAmount}
      />
      {account && !hasNoPosition ? (
        <FarmInfo farm={farm} isReady={isReady} onAddLiquidity={addLiquidityModal.onOpen} />
      ) : (
        <NoPosition
          inactive={inactive}
          account={account!}
          hasNoPosition={hasNoPosition}
          onAddLiquidityClick={addLiquidityModal.onOpen}
          connectWalletButton={<ConnectWalletButton mt="8px" width="100%" />}
        />
      )}
    </Action>
  )
}

export default CardActions
