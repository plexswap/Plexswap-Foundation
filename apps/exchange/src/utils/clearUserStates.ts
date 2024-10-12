import { configureScope } from '@sentry/nextjs'
import { Dispatch } from '@reduxjs/toolkit'
import { resetUserState, toggleFarmTransactionModal } from 'state/global/actions'
import { LS_ORDERS } from './localStorageOrders'
import getLocalStorageItemKeys from './getLocalStorageItemKeys'

export const clearUserStates = (
  dispatch: Dispatch<any>,
  {
    chainId,
    newChainId,
  }: {
    chainId?: number
    newChainId?: number
  },
) => {
  if (chainId) {
    dispatch(resetUserState({ chainId, newChainId }))
  }
  dispatch(toggleFarmTransactionModal({ showModal: false }))
  configureScope((scope) => scope.setUser(null))
  const lsOrderKeys = getLocalStorageItemKeys(LS_ORDERS)
  lsOrderKeys.forEach((lsOrderKey) => window?.localStorage?.removeItem(lsOrderKey))
}
