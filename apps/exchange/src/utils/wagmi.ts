import { getWagmiConnectorV2 } from '@binance/w3w-wagmi-connector-v2'
import { cyberWalletConnector as createCyberWalletConnector, isCyberWallet } from '@cyberlab/cyber-app-sdk'
import { blocto } from '@plexswap/wagmi/connectors/blocto'
import { CHAINS } from '@plexswap/chains'
import { PUBLIC_NODES } from 'config/nodes'
import memoize from 'lodash/memoize'
import { Transport } from 'viem'
import { createConfig, fallback, http } from 'wagmi'
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors'
import { CLIENT_CONFIG, publicClient } from './viem'

export const chains = CHAINS

export const injectedConnector = injected({
  shimDisconnect: false,
})

export const coinbaseConnector = coinbaseWallet({
  appName: 'Plexswap',
  appLogoUrl: 'https://swap.plexfinance.us/logo.png',
})

export const walletConnectConnector = walletConnect({
  // ignore the error in test environment
  // Error: To use QR modal, please install @walletconnect/modal package
  showQrModal: process.env.NODE_ENV !== 'test',
  projectId: 'e542ff314e26ff34de2d4fba98db70bb',
})

export const walletConnectNoQrCodeConnector = walletConnect({
  showQrModal: false,
  projectId: 'e542ff314e26ff34de2d4fba98db70bb',
})

export const metaMaskConnector = injected({ target: 'metaMask', shimDisconnect: false })
export const trustConnector = injected({ target: 'trust', shimDisconnect: false })

const bloctoConnector = blocto({
  appId: 'e2f2f0cd-3ceb-4dec-b293-bb555f2ed5af',
})

export const binanceWeb3WalletConnector = getWagmiConnectorV2()

export const noopStorage = {
  getItem: (_key: any) => '',
  setItem: (_key: any, _value: any) => {},
  removeItem: (_key: any) => {},
}

export const transports = chains.reduce((ts, chain) => {

  const  httpStrings = PUBLIC_NODES[chain.id] ? PUBLIC_NODES[chain.id] : []

  if (ts) {
    return {
      ...ts,
      [chain.id]: fallback(httpStrings.map((t: any) => http(t))),
    }
  }

  return {
    [chain.id]: fallback(httpStrings.map((t: any) => http(t))),
  }
}, {} as Record<number, Transport>)

export const cyberWalletConnector = isCyberWallet()
  ? createCyberWalletConnector({
      name: 'Plexswap',
      appId: 'b825cd87-2db3-456d-b108-d61e74d89771',
    })
  : undefined

export function createWagmiConfig() {
  return createConfig({
    chains,
    ssr: true,
    syncConnectedChain: true,
    transports,
    ...CLIENT_CONFIG,

    connectors: [
      metaMaskConnector,
      injectedConnector,
      safe(),
      coinbaseConnector,
      walletConnectConnector,
      bloctoConnector,
      // ledgerConnector,
      trustConnector,
      binanceWeb3WalletConnector(),

      ...(cyberWalletConnector ? [cyberWalletConnector as any] : []),
    ],
  })
}

export const CHAIN_IDS = chains.map((c) => c.id)

export const isChainSupported = memoize((chainId: number) => (CHAIN_IDS as number[]).includes(chainId))
export const isChainTestnet = memoize((chainId: number) => {
  const found = chains.find((c) => c.id === chainId)
  return found ? 'testnet' in found : false
})

export { publicClient }
