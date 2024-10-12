import { ResetCSS, ScrollToTopButtonCore, ToastListener } from '@plexswap/ui-plex'
import BigNumber from 'bignumber.js'
import { SentryErrorBoundary } from 'components/ErrorBoundary'
import { PageMeta } from 'components/Layout/Page'
import { NetworkModal } from 'components/NetworkModal'
import TransactionsDetailModal from 'components/TransactionDetailModal'
import { VercelToolbar } from 'components/VercelToolbar'
import 'core-js/features/string/replace-all'
import { useAccountEventListener } from 'hooks/useAccountEventListener'
import useEagerConnect from 'hooks/useEagerConnect'
import useLockedEndNotification from 'hooks/useLockedEndNotification'
import useSentryUser from 'hooks/useSentryUser'
import useThemeCookie from 'hooks/useThemeCookie'
import useUserAgent from 'hooks/useUserAgent'
import { NextPage } from 'next'
import { DefaultSeo } from 'next-seo'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'
import { Fragment } from 'react'
import { PersistGate } from 'redux-persist/integration/react'
import { useDataDogRUM } from 'hooks/useDataDogRUM'
import { useLoadExperimentalFeatures } from 'hooks/useExperimentalFeatureEnabled'
import { useVercelFeatureFlagOverrides } from 'hooks/useVercelToolbar'
import { useWeb3WalletView } from 'hooks/useWeb3WalletView'
import { useInitGlobalWorker } from 'hooks/useWorker'
import { persistor, useStore } from 'state'
import { usePollBlockNumber } from 'state/block/hooks'
import { Blocklist, Updaters } from '..'
import { SEO } from '../../next-seo.config'
import Providers from '../Providers'
import Menu from '../components/Menu'
import GlobalStyle from '../style/Global'

// This config is required for number formatting
BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
})

function GlobalHooks() {
  useInitGlobalWorker()
  useDataDogRUM()
  useWeb3WalletView()
  useLoadExperimentalFeatures()
  useVercelFeatureFlagOverrides()
  usePollBlockNumber()
  useEagerConnect()
  useUserAgent()
  useAccountEventListener()
  useSentryUser()
  useThemeCookie()
  useLockedEndNotification()
  return null
}

function MPGlobalHooks() {
  usePollBlockNumber()
  useUserAgent()
  useAccountEventListener()
  useSentryUser()
  useLockedEndNotification()
  return null
}

function MyApp(props: AppProps<{ initialReduxState: any; dehydratedState: any }>) {
  const { pageProps, Component } = props
  const store = useStore(pageProps.initialReduxState)

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, minimum-scale=1, viewport-fit=cover"
        />
        <meta
          name="description"
          content="Discover PlexSwap, an exclusive DEX on BNB Smart Chain (BSC) with special Farms and Crop Silos in DeFi."
        />
        <meta name="theme-color" content="#1FC7D4" />
        {(Component as NextPageWithLayout).mp && (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script src="https://public.bnbstatic.com/static/js/mp-webview-sdk/webview-v1.0.0.min.js" id="mp-webview" />
        )}
      </Head>
      <DefaultSeo {...SEO} />
      <Providers store={store} dehydratedState={pageProps.dehydratedState}>
        <PageMeta />
        {(Component as NextPageWithLayout).Meta && (
          // @ts-ignore
          <Component.Meta {...pageProps} />
        )}
        {(Component as NextPageWithLayout).mp ? <MPGlobalHooks /> : <GlobalHooks />}
        <ResetCSS />
        <GlobalStyle />
        <PersistGate loading={null} persistor={persistor}>
          <Updaters />
          <App {...props} />
        </PersistGate>
      </Providers>
      <Script
        strategy="afterInteractive"
        id="google-tag"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTAG}');
          `,
        }}
      />
    </>
  )
}

type NextPageWithLayout = NextPage & {
  Layout?: React.FC<React.PropsWithChildren<unknown>>
  /** render component without all layouts */
  pure?: true
  /** is mini program */
  mp?: boolean
  /**
   * allow chain per page, empty array bypass chain block modal
   * @default [ChainId.BSC]
   * */
  chains?: number[]
  isShowScrollToTopButton?: true
  screen?: true
  /**
   * Meta component for page, hacky solution for static build page to avoid `PersistGate` which blocks the page from rendering
   */
  Meta?: React.FC<React.PropsWithChildren<unknown>>
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const ProductionErrorBoundary = process.env.NODE_ENV === 'production' ? SentryErrorBoundary : Fragment

const App = ({ Component, pageProps }: AppPropsWithLayout) => {
  if (Component.pure) {
    return <Component {...pageProps} />
  }

  // Use the layout defined at the page level, if available
  const Layout = Component.Layout || Fragment
  const ShowMenu = Component.mp ? Fragment : Menu
  const isShowScrollToTopButton = Component.isShowScrollToTopButton || true
  const shouldScreenWallet = Component.screen || false

  return (
    <ProductionErrorBoundary>
      <ShowMenu>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ShowMenu>

      <ToastListener />

      <NetworkModal pageSupportedChains={Component.chains} />
      <TransactionsDetailModal />
      {isShowScrollToTopButton && <ScrollToTopButtonCore />}
      {shouldScreenWallet && <Blocklist />}
      <VercelToolbar />
    </ProductionErrorBoundary>
  )
}

export default MyApp