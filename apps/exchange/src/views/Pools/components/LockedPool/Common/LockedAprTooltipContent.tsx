import { useTranslation } from '@plexswap/localization'

export default function LockedAprTooltipContent() {
  const { t } = useTranslation()
  return <>{t('To continue receiving WAYA rewards, please migrate your Fixed-Term Staking WAYA Balance to veWAYA')}</>
}
