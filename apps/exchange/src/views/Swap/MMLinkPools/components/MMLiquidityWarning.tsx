import { useTranslation } from '@plexswap/localization'
import { Alert } from '@plexswap/ui-plex'

export const MMLiquidityWarning: React.FC = () => {
  const { t } = useTranslation()
  return <Alert title={t('MMs are temporarily unable to facilitate trades. Please try again later')} variant="info" />
}
