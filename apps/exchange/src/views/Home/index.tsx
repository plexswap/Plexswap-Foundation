import { PageSection } from '@plexswap/ui-plex'
import { useTheme } from  '@plexswap/hooks'
import { PageMeta } from 'components/Layout/Page'
import { useTranslation } from '@plexswap/localization'
import { swapSectionData, wayaSectionData } from './components/SalesSection/data'
import SalesSection from './components/SalesSection'
import WayaDataRow from './components/WayaDataRow'

const Home: React.FC<React.PropsWithChildren> = () => {
  const { theme } = useTheme()

  const HomeSectionContainerStyles = { margin: '0', width: '100%', maxWidth: '968px' }

  const { t } = useTranslation()

  return (
    <>
      <PageMeta />

      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        background={theme.colors.background}
        index={2}
        hasCurvedDivider={false}
      >
        <SalesSection {...swapSectionData(t)} />
      </PageSection>

      <PageSection
        innerProps={{ style: HomeSectionContainerStyles }}
        background={theme.colors.background}
        index={2}
        hasCurvedDivider={false}
      >
        <SalesSection {...wayaSectionData(t)} />
        <WayaDataRow />
      </PageSection>
    </>
  )
}

export default Home
