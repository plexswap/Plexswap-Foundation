import { useTranslation } from '@plexswap/localization'
import { SubMenuItems } from '@plexswap/ui-plex'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { multiChainQueryStableClient } from 'state/info/constant'
import { useChainNameByQuery, useMultiChainPath } from 'state/info/hooks'
import { extendedInfoPath } from '../../constants'
import InfoNav from './InfoNav'

export const InfoPageLayout = ({ children }) => {
  const router = useRouter()
  const chainName = useChainNameByQuery()
  const chainPath = useMultiChainPath()
  const isExtended = router?.pathname?.includes(extendedInfoPath)
  const { t } = useTranslation()

  const subMenuItems = useMemo(() => {
    const config = [
      {
        label: t('Extended'),
        href: `/info/extended${chainPath}`,
      },
      {
        label: t('V2'),
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
      <SubMenuItems items={subMenuItems} activeItem={isExtended ? `/info/extended${chainPath}` : `/info${chainPath}`} />
      <InfoNav isStableSwap={false} />
      {children}
    </>
  )
}
