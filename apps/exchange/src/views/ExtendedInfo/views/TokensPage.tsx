import { useTranslation } from '@plexswap/localization'
import { Heading } from '@plexswap/ui-plex'
import Page from 'components/Layout/Page'
import { useMemo } from 'react'
import { useTopTokensData } from 'views/ExtendedInfo/hooks'
import TokenTable from '../components/TokenTable'
import TopTokenMovers from '../components/TopTokenMovers'

const TokensOverview: React.FC<React.PropsWithChildren> = () => {
  const { t } = useTranslation()

  const allTokens = useTopTokensData()

  const formattedTokens = useMemo(() => {
    if (allTokens)
      return Object.values(allTokens)
        .map((token) => token)
        .filter((token) => token)
    return []
  }, [allTokens])

  return (
    <Page>
      {}
      <TopTokenMovers />
      <Heading scale="lg" mt="40px" mb="16px" id="info-tokens-title">
        {t('All Tokens')}
      </Heading>
      <TokenTable tokenDatas={formattedTokens} />
    </Page>
  )
}

export default TokensOverview
