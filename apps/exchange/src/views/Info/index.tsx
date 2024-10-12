import { useTranslation } from '@plexswap/localization'
import { SubMenuItems } from '@plexswap/ui-plex'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { multiChainQueryStableClient } from 'state/info/constant'
import { useChainNameByQuery, useMultiChainPath } from 'state/info/hooks'
import InfoNav from './components/InfoNav'

export const InfoPageLayout = ({ children }) => {
  const router = useRouter()
  const chainName = useChainNameByQuery()
  const chainPath = useMultiChainPath()
  const { t } = useTranslation()
  const isStableSwap = router.query.type === 'stableSwap'
  const subMenuItems = useMemo(() => {
    const config = [
      {
        label: t('Core'),
        href: `/info${chainPath}`,
      },
    ]
    if (multiChainQueryStableClient[chainName])
      config.push({
        label: t('StableSwap'),
        href: `/info${chainPath}?type=stableSwap`,
      })
    return config
  }, [t, chainPath, chainName])

  return (
    <>
      <SubMenuItems
        items={subMenuItems}
        activeItem={isStableSwap ? `/info${chainPath}?type=stableSwap` : `/info${chainPath}`}
      />

      <InfoNav isStableSwap={isStableSwap} />
      {children}
    </>
  )
}
