import { useTranslation } from '@plexswap/localization'
import { useMemo } from 'react'
import { Grid, Modal, ModalCore, Text } from '@plexswap/ui-plex'
import { useAccount } from 'wagmi'
import { BLOCKED_ADDRESSES } from './config/constants'
import ListsUpdater from './state/lists/updater'
import MulticallUpdater from './state/multicall/updater'
import TransactionUpdater from './state/transactions/updater'
import { chains } from './utils/wagmi'

export function Updaters() {
  return (
    <>
      <ListsUpdater />
      {chains.map((chain) => (
        <TransactionUpdater key={`trxUpdater#${chain.id}`} chainId={chain.id} />
      ))}
      <MulticallUpdater />
    </>
  )
}

export function Blocklist() {
  const { address } = useAccount()
  const { t } = useTranslation()
  const blocked: boolean = useMemo(() => Boolean(address && BLOCKED_ADDRESSES.indexOf(address) !== -1), [address])
  if (blocked) {
    return (
      <ModalCore isOpen closeOnOverlayClick={false} disableOutsidePointerEvents>
        <Modal title={t('Blocked address')} hideCloseButton>
          <Grid style={{ gap: '16px' }} maxWidth={['100%', null, '400px']}>
            <Text style={{ wordBreak: 'break-word' }}>{address}</Text>
            <Text>
              {t('We have detected that this address is associated with a Prohibited Activity')}{' '}
            </Text>
          </Grid>
        </Modal>
      </ModalCore>
    )
  }

  return null
}
