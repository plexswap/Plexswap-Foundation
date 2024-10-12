import { useTranslation } from '@plexswap/localization'
import { SwapWidget as Swap } from '@plexswap/widgets-internal'
import { EXCHANGE_DOCS_URLS } from 'config/constants'

const Page: React.FC<
  React.PropsWithChildren<{
    removePadding?: boolean
    hideFooterOnDesktop?: boolean
    noMinHeight?: boolean
    helpUrl?: string
  }>
> = ({
  children,
  removePadding = false,
  hideFooterOnDesktop = false,
  noMinHeight = false,
  helpUrl = EXCHANGE_DOCS_URLS,
  ...props
}) => {
  const { t } = useTranslation()
  const externalText = t('Learn more about Symplexia Labs.')
  const externalLinkUrl = 'https://symplexia.com/'

  return (
    <Swap.Page
      removePadding={removePadding}
      noMinHeight={noMinHeight}
      hideFooterOnDesktop={hideFooterOnDesktop}
      helpUrl={helpUrl}
      externalText={externalText}
      externalLinkUrl={externalLinkUrl}
      {...props}
    >
      {children}
    </Swap.Page>
  )
}

export default Page
