import { Skeleton } from '@plexswap/ui-plex'
import BigNumber from 'bignumber.js'
import { BASE_ADD_LIQUIDITY_URL } from 'config'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { styled } from 'styled-components'
import getLiquidityUrlPathParts from 'utils/getLiquidityUrlPathParts'
import ApyButton from 'views/Farms/components/FarmCard/ApyButton'

export interface AprProps {
  value: string
  multiplier: string
  pid: number
  lpLabel: string
  lpSymbol: string
  lpRewardsApr: number
  lpTokenPrice: BigNumber
  tokenAddress?: string
  quoteTokenAddress?: string
  wayaPrice: BigNumber
  originalValue: number
  hideButton?: boolean
  strikethrough?: boolean
  useTooltipText?: boolean
  boosted?: boolean
  stableSwapAddress?: string
  stableLpFee?: number
  farmWayaPerSecond?: string
  totalMultipliers?: string
  boosterMultiplier?: number
  isBooster?: boolean
}

const Container = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.text};

  button {
    width: 20px;
    height: 20px;

    svg {
      path {
        fill: ${({ theme }) => theme.colors.textSubtle};
      }
    }
  }
`

const AprWrapper = styled.div`
  min-width: 60px;
  text-align: left;
`

const Apr: React.FC<React.PropsWithChildren<AprProps>> = ({
  value,
  pid,
  lpLabel,
  lpSymbol,
  lpTokenPrice,
  multiplier,
  tokenAddress,
  quoteTokenAddress,
  wayaPrice,
  originalValue,
  hideButton = false,
  lpRewardsApr,
  useTooltipText = true,
  stableSwapAddress,
  stableLpFee,
  farmWayaPerSecond,
  totalMultipliers,
  isBooster,
  boosterMultiplier,
}) => {
  const { chainId } = useActiveChainId()
  const liquidityUrlPathParts = getLiquidityUrlPathParts({ quoteTokenAddress, tokenAddress, chainId })
  const addLiquidityUrl = `${BASE_ADD_LIQUIDITY_URL}/${liquidityUrlPathParts}`
  return originalValue !== 0 || lpRewardsApr !== 0 ? (
    <Container>
      {originalValue || lpRewardsApr !== 0 ? (
        <ApyButton
          variant={hideButton ? 'text' : 'text-and-button'}
          pid={pid}
          lpSymbol={lpSymbol}
          lpLabel={lpLabel}
          lpTokenPrice={lpTokenPrice}
          multiplier={multiplier}
          wayaPrice={wayaPrice}
          apr={originalValue}
          displayApr={value}
          lpRewardsApr={lpRewardsApr}
          addLiquidityUrl={addLiquidityUrl}
          useTooltipText={useTooltipText}
          hideButton={hideButton}
          stableSwapAddress={stableSwapAddress}
          stableLpFee={stableLpFee}
          farmWayaPerSecond={farmWayaPerSecond}
          totalMultipliers={totalMultipliers}
          isBooster={isBooster}
          boosterMultiplier={boosterMultiplier}
        />
      ) : (
        <AprWrapper>
          <Skeleton width={60} />
        </AprWrapper>
      )}
    </Container>
  ) : (
    <Container>
      <AprWrapper>{originalValue}%</AprWrapper>
    </Container>
  )
}

export default Apr
