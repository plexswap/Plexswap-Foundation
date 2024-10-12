import { SmartRouterTrade,  } from '@plexswap/gateway-guardians/Ananke'
import { AetherRouter } from '@plexswap/gateway-guardians'
import { TradeType } from '@plexswap/sdk-core'
import { MMCommitTrade } from '../types'
import { MMCommitButton } from './MMCommitButton'
import { SwapCommitButton } from './SwapCommitButton'

type Trade = SmartRouterTrade<TradeType> | AetherRouter.AetherTradeWithoutGraph<TradeType>

export type CommitButtonProps = {
  trade: Trade | MMCommitTrade<SmartRouterTrade<TradeType>> | undefined
  tradeError?: Error
  tradeLoaded: boolean
  beforeCommit?: () => void
  afterCommit?: () => void
}

export const CommitButton: React.FC<CommitButtonProps> = ({
  trade,
  tradeError,
  tradeLoaded,
  beforeCommit,
  afterCommit,
}) => {
  if (trade && 'isMMBetter' in trade && trade?.isMMBetter) {
    const currentTrade = trade
    return <MMCommitButton {...currentTrade} beforeCommit={beforeCommit} afterCommit={afterCommit} />
  }

  const currentTrade = trade as SmartRouterTrade<TradeType>
  return (
    <SwapCommitButton
      trade={currentTrade}
      tradeError={tradeError}
      tradeLoading={!tradeLoaded}
      beforeCommit={beforeCommit}
      afterCommit={afterCommit}
    />
  )
}
