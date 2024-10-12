import { StyledLink, Text, useToast  } from '@plexswap/ui-plex'
import { NextLinkFromReactRouter } from '@plexswap/widgets-internal'
import { useTranslation } from '@plexswap/localization'
import isUndefinedOrNull from '@plexswap/utils/isUndefinedOrNull'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import atomWithStorageWithErrorCatch from 'utils/atomWithStorageWithErrorCatch'
import { useAccount } from 'wagmi'
import { useUserWayaLockStatus } from './useUserWayaLockStatus'

const lockedNotificationShowAtom = atomWithStorageWithErrorCatch('lockedNotificationShow', true, () => sessionStorage)
function useLockedNotificationShow() {
  return useAtom(lockedNotificationShowAtom)
}

const LockedEndDescription: React.FC = () => {
  const { t } = useTranslation()
  return (
    <>
      <Text>{t('The locked staking duration has ended.')}</Text>
      <NextLinkFromReactRouter to="/pools" prefetch={false}>
        <StyledLink color="primary">{t('Go to Pools')}</StyledLink>
      </NextLinkFromReactRouter>
    </>
  )
}

const useLockedEndNotification = () => {
  const { t } = useTranslation()
  const { toastInfo } = useToast()
  const queryClient = useQueryClient()
  const { address: account } = useAccount()
  const isUserLockedEnd = useUserWayaLockStatus()
  const [lockedNotificationShow, setLockedNotificationShow] = useLockedNotificationShow()

  useEffect(() => {
    if (account) {
      if (!isUndefinedOrNull(isUserLockedEnd)) {
        setLockedNotificationShow(true)
        queryClient.invalidateQueries({
          queryKey: ['userWayaLockStatus', account],
        })
      }
    } else {
      setLockedNotificationShow(true)
    }
  }, [setLockedNotificationShow, account, queryClient, isUserLockedEnd])

  useEffect(() => {
    if (toastInfo && isUserLockedEnd && lockedNotificationShow) {
      toastInfo(t('Waya Pool'), <LockedEndDescription />)
      setLockedNotificationShow(false) // show once
    }
  }, [isUserLockedEnd, toastInfo, lockedNotificationShow, setLockedNotificationShow, t])
}

export default useLockedEndNotification
