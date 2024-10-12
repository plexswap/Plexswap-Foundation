import { useTranslation } from '@plexswap/localization'
import { Tag } from '@plexswap/ui-plex'
import { FeeAmount } from '@plexswap/sdk-extended'
import { PoolState } from 'hooks/extended/types'
import { useFeeTierDistribution } from 'hooks/extended/useFeeTierDistribution'

export function FeeTierPercentageBadge({
  feeAmount,
  distributions,
  poolState,
}: {
  feeAmount: FeeAmount
  distributions: ReturnType<typeof useFeeTierDistribution>['distributions']
  poolState: PoolState
}) {
  const { t } = useTranslation()

  return (
    <Tag
      variant="secondary"
      outline
      fontSize="10px"
      padding="4px"
      style={{
        width: 'fit-content',
        justifyContent: 'center',
        whiteSpace: 'inherit',
        alignSelf: 'flex-end',
        textAlign: 'center',
      }}
    >
      {!distributions || poolState === PoolState.NOT_EXISTS || poolState === PoolState.INVALID
        ? t('Not Created')
        : distributions[feeAmount] !== undefined
        ? `${distributions[feeAmount]?.toFixed(0)}% ${t('Pick')}`
        : t('No Data')}
    </Tag>
  )
}
