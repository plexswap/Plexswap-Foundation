import { useTranslation } from '@plexswap/localization'
import { Flex, Modal, ModalBody } from '@plexswap/ui-plex'
import { LightGreyCard } from 'components/Card'
import { useMemo } from 'react'
import { useFarmHarvestTransaction } from 'state/global/hooks'
import { FarmTransactionStatus, SpecialFarmStepType } from 'state/transactions/actions'
import { useAllTransactions } from 'state/transactions/hooks'
import FarmDetail from './FarmDetail'
import FarmInfo from './FarmInfo'

interface FarmTransactionModalProps {
  onDismiss: () => void
}

const FarmTransactionModal: React.FC<React.PropsWithChildren<FarmTransactionModalProps>> = ({ onDismiss }) => {
  const { t } = useTranslation()
  const allTransactions = useAllTransactions()
  const { pickedTx } = useFarmHarvestTransaction()

  const pickedData = useMemo(() => allTransactions?.[pickedTx.chainId]?.[pickedTx.tx], [allTransactions, pickedTx])

  const modalTitle = useMemo(() => {
    let title = ''

    if (pickedData?.specialFarm) {
      const { type, status } = pickedData?.specialFarm || {}
      const isPending = status === FarmTransactionStatus.PENDING
      if (type === SpecialFarmStepType.STAKE) {
        title = isPending ? t('Staking') : t('Staked!')
      } else if (type === SpecialFarmStepType.UNSTAKE) {
        title = isPending ? t('Unstaking') : t('Unstaked!')
      }
    }
    return title
  }, [pickedData, t])

  return (
    <Modal title={modalTitle} onDismiss={onDismiss}>
      <ModalBody width={['100%', '100%', '100%', '352px']}>
        <Flex flexDirection="column">
          <FarmInfo pickedData={pickedData} />
          <LightGreyCard padding="16px 16px 0 16px">
            {pickedData?.specialFarm?.steps.map((step) => (
              <FarmDetail key={step.step} step={step} status={pickedData?.specialFarm?.status} />
            ))}
          </LightGreyCard>
        </Flex>
      </ModalBody>
    </Modal>
  )
}

export default FarmTransactionModal
