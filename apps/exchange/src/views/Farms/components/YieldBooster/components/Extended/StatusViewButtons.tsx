import { useTranslation } from '@plexswap/localization'
import { Button } from '@plexswap/ui-plex'
import NextLink from 'next/link'

export const StatusViewButtons: React.FC<{
  updateButton: React.ReactElement | null
  locked: boolean
  isTableView?: boolean
}> = ({ updateButton, locked }) => {
  const { t } = useTranslation()
  return (
    <>
      {!locked &&
        (
          <NextLink href="/waya-staking" passHref>
            <Button width="100%" style={{ whiteSpace: 'nowrap' }}>
              {t('Go to Lock')}
            </Button>
          </NextLink>
        )}
      { updateButton }
    </>
  )
}
