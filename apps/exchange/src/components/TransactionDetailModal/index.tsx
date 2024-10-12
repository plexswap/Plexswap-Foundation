import { ModalCore } from '@plexswap/ui-plex'
import { useAppDispatch } from 'state'
import { toggleFarmTransactionModal } from 'state/global/actions'
import { useFarmHarvestTransaction } from 'state/global/hooks'
import FarmTransactionModal from './FarmTransactionModal'

const TransactionsDetailModal = () => {
  const { showModal } = useFarmHarvestTransaction()
  const dispatch = useAppDispatch()

  const closeModal = () => {
    dispatch(toggleFarmTransactionModal({ showModal: false }))
  }

  return (
    <ModalCore isOpen={showModal} closeOnOverlayClick onDismiss={closeModal}>
      <FarmTransactionModal onDismiss={closeModal} />
    </ModalCore>
  )
}

export default TransactionsDetailModal
