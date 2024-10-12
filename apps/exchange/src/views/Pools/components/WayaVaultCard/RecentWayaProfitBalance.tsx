import { Token } from '@plexswap/sdk-core'
import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { Balance, TooltipText, useTooltip } from '@plexswap/ui-plex'

import AutoEarningsBreakdown from '../AutoEarningsBreakdown'

interface RecentWayaProfitBalanceProps {
  wayaToDisplay: number
  pool: Pool.DeserializedPool<Token>
  account: string
}

const RecentWayaProfitBalance: React.FC<React.PropsWithChildren<RecentWayaProfitBalanceProps>> = ({
  wayaToDisplay,
  pool,
  account,
}) => {
  const { targetRef, tooltip, tooltipVisible } = useTooltip(<AutoEarningsBreakdown pool={pool} account={account} />, {
    placement: 'bottom-end',
  })

  return (
    <>
      {tooltipVisible && tooltip}
      <TooltipText ref={targetRef} small>
        <Balance fontSize="14px" value={wayaToDisplay} />
      </TooltipText>
    </>
  )
}

export default RecentWayaProfitBalance
