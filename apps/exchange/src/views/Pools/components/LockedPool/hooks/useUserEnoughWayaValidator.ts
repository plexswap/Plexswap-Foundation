import BigNumber from 'bignumber.js'
import { useTranslation } from '@plexswap/localization'
import { getBalanceAmount } from '@plexswap/utils/formatBalance'

import { useMemo } from 'react'

export const useUserEnoughWayaValidator = (wayaAmount: string, stakingTokenBalance: BigNumber) => {
  const { t } = useTranslation()
  const errorMessage = t('Insufficient WAYA balance')

  const userNotEnoughWaya = useMemo(() => {
    if (new BigNumber(wayaAmount).gt(getBalanceAmount(stakingTokenBalance, 18))) return true
    return false
  }, [wayaAmount, stakingTokenBalance])
  return { userNotEnoughWaya, notEnoughErrorMessage: errorMessage }
}
