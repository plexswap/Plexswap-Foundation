import { ChainId } from '@plexswap/chains'
import { useTranslation } from '@plexswap/localization'
import { AppHeader } from 'components/App'
import { BodyWrapper } from 'components/App/AppBody'
import { useRouter } from 'next/router'
import { safeGetAddress } from 'utils'
import LiquidityFormProvider from 'views/AddLiquidityExtended/formViews/ExtendedFormView/form/LiquidityFormProvider'
import { Migrate } from 'views/AddLiquidityExtended/Migrate'
import Page from 'views/Page'

function MigratePage() {
  // const { t } = useTranslation()

  const router = useRouter()

  const address = safeGetAddress(router.query.address)

  const { t } = useTranslation()

  return (
    <LiquidityFormProvider>
      <Page>
        <BodyWrapper style={{ maxWidth: '858px' }}>
          <AppHeader title={t('Migrate Liquidity')} />
          {address && <Migrate corePairAddress={address} />}
        </BodyWrapper>
      </Page>
    </LiquidityFormProvider>
  )
}

export default MigratePage

MigratePage.screen = true
MigratePage.chains = [ChainId.BSC, ChainId.PLEXCHAIN, ChainId.BSC_TESTNET]
