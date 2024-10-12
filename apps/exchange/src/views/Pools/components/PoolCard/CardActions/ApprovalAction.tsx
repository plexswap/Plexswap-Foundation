import { useTranslation } from '@plexswap/localization'
import { Token } from '@plexswap/sdk-core'
import { PoolWidget as Pool } from '@plexswap/widgets-internal'
import { AutoRenewIcon, Button, Skeleton } from '@plexswap/ui-plex'
import { useERC20 } from 'hooks/useContract'
import { useApprovePool } from '../../../hooks/useApprove'

interface ApprovalActionProps {
  pool: Pool.DeserializedPool<Token>
  isLoading?: boolean
}

const ApprovalAction: React.FC<React.PropsWithChildren<ApprovalActionProps>> = ({ pool, isLoading = false }) => {
  const { poolId, stakingToken, earningToken } = pool
  const { t } = useTranslation()
  const stakingTokenContract = useERC20(stakingToken.address)
  const { handleApprove, pendingTx } = useApprovePool(stakingTokenContract, poolId, earningToken.symbol)

  return (
    <>
      {isLoading ? (
        <Skeleton width="100%" height="52px" />
      ) : (
        <Button
          isLoading={pendingTx}
          endIcon={pendingTx ? <AutoRenewIcon spin color="currentColor" /> : null}
          disabled={pendingTx}
          onClick={handleApprove}
          width="100%"
        >
          {t('Enable')}
        </Button>
      )}
    </>
  )
}

export default ApprovalAction
