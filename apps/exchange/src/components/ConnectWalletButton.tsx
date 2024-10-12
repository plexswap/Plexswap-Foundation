import { useTranslation } from '@plexswap/localization'
import { Button, ButtonProps } from '@plexswap/ui-plex'
import { WalletModalCore } from '@plexswap/wallets'
import { createWallets, getDocLink } from 'config/wallet'
import { useActiveChainId } from 'hooks/useActiveChainId'
import useAuth from 'hooks/useAuth'

import { ChainId } from '@plexswap/chains'
import { useMemo, useState } from 'react'
import { logGTMWalletConnectEvent } from 'utils/customGTMEventTracking'
import { useConnect } from 'wagmi'
import Trans from './Trans'

const ConnectWalletButton = ({ children, ...props }: ButtonProps) => {
  const { login } = useAuth()
  const {
    t,
    currentLanguage: { code },
  } = useTranslation()
  const { connectAsync } = useConnect()
  const { chainId } = useActiveChainId()
  const [open, setOpen] = useState(false)

  const docLink = useMemo(() => getDocLink(code), [code])

  const wallets = useMemo(() => createWallets(chainId || ChainId.BSC, connectAsync), [chainId, connectAsync])

  return (
    <>
      <Button onClick={() => setOpen(true)} {...props}>
        {children || <Trans>Connect Wallet</Trans>}
      </Button>
      <style jsx global>{`
        w3m-modal {
          position: relative;
          z-index: 99;
        }
      `}</style>
      <WalletModalCore
        docText={t('Learn How to Connect')}
        docLink={docLink}
        isOpen={open}
        wallets={wallets}
        login={login}
        onDismiss={() => setOpen(false)}
        onWalletConnectCallBack={logGTMWalletConnectEvent}
      />
    </>
  )
}

export default ConnectWalletButton