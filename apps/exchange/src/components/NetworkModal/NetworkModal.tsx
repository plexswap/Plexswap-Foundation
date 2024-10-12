import { ChainId } from '@plexswap/chains'
import { ModalCore } from '@plexswap/ui-plex'
import { SUPPORT_ONLY_BSC } from 'config/constants/supportedChains'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { atom, useAtom } from 'jotai'
import dynamic from 'next/dynamic'
import { useCallback, useMemo } from 'react'
import { viemClients } from 'utils/viem'
import { CHAIN_IDS } from 'utils/wagmi'

export const hideWrongNetworkModalAtom = atom(false)

const PageNetworkSupportModal = dynamic(
  () => import('./PageNetworkSupportModal').then((mod) => mod.PageNetworkSupportModal),
  { ssr: false },
)
const WrongNetworkModal = dynamic(() => import('./WrongNetworkModal').then((mod) => mod.WrongNetworkModal), {
  ssr: false,
})
const UnsupportedNetworkModal = dynamic(
  () => import('./UnsupportedNetworkModal').then((mod) => mod.UnsupportedNetworkModal),
  { ssr: false },
)

export const NetworkModal = ({ pageSupportedChains = SUPPORT_ONLY_BSC }: { pageSupportedChains?: number[] }) => {
  const { chainId, chain, isWrongNetwork } = useActiveWeb3React()
  const [dismissWrongNetwork, setDismissWrongNetwork] = useAtom(hideWrongNetworkModalAtom)

  const isBNBOnlyPage = useMemo(() => {
    return pageSupportedChains?.length === 1 && pageSupportedChains[0] === ChainId.BSC
  }, [pageSupportedChains])

  const isPageNotSupported = useMemo(
    () => Boolean(pageSupportedChains.length) && chainId && !pageSupportedChains.includes(chainId),
    [chainId, pageSupportedChains],
  )
  const handleDismiss = useCallback(() => setDismissWrongNetwork(true), [setDismissWrongNetwork])

  if (pageSupportedChains?.length === 0) return null // open to all chains

  if (isPageNotSupported && isBNBOnlyPage) {
    return (
      <ModalCore isOpen closeOnOverlayClick={false}>
        <PageNetworkSupportModal />
      </ModalCore>
    )
  }

  if (isWrongNetwork && !dismissWrongNetwork && !isPageNotSupported) {
    const currentChain = Object.values(viemClients)
      .map((client) => client.chain)
      .find((c) => c?.id === chainId)
    if (!currentChain) return null
    return (
      <ModalCore isOpen={isWrongNetwork} closeOnOverlayClick={false} onDismiss={handleDismiss}>
        <WrongNetworkModal currentChain={currentChain} onDismiss={handleDismiss} />
      </ModalCore>
    )
  }

  if ((chain?.unsupported ?? false) || isPageNotSupported) {
    return (
      <ModalCore isOpen closeOnOverlayClick={false}>
        <UnsupportedNetworkModal pageSupportedChains={pageSupportedChains?.length ? pageSupportedChains : CHAIN_IDS} />
      </ModalCore>
    )
  }

  return null
}