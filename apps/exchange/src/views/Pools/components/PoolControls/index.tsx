import { Token } from '@plexswap/sdk-core'
import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { useInitialBlockTimestamp } from 'state/block/hooks'
import { useUserPoolStakedOnly, useUserPoolsViewMode } from 'state/user/hooks'
import { useAccount } from 'wagmi'

const POOL_START_THRESHOLD = 60 * 4

export default function PoolControlsContainer(props) {
  const [stakedOnly, setStakedOnly] = useUserPoolStakedOnly()
  const [viewMode, setViewMode] = useUserPoolsViewMode()
  const { address: account } = useAccount()
  const initialBlockTimestamp = useInitialBlockTimestamp()
  const threshHold = Number(initialBlockTimestamp) > 0 ? Number(initialBlockTimestamp) + POOL_START_THRESHOLD : 0

  return (
    <Pool.PoolControls<Token>
      {...props}
      stakedOnly={stakedOnly}
      setStakedOnly={setStakedOnly}
      viewMode={viewMode}
      setViewMode={setViewMode}
      account={account}
      threshHold={threshHold}
    />
  )
}
