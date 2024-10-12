import { useActiveChainId } from 'hooks/useActiveChainId'
import React, { createContext, useMemo } from 'react'
import { ACCESS_TOKEN_SUPPORT_CHAIN_IDS,
         STABLE_SUPPORT_CHAIN_IDS   } from 'config/constants/supportedChains'

export const SwapFeaturesContext = createContext<{
  isStableSupported: boolean
  isAccessTokenSupported: boolean
}>({
  isStableSupported: false,
  isAccessTokenSupported: false,
})

export const SwapFeaturesProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { chainId } = useActiveChainId()

  const isStableSupported = useMemo(() => !chainId || STABLE_SUPPORT_CHAIN_IDS.includes(chainId), [chainId])

  const isAccessTokenSupported = useMemo(
    () => Boolean(chainId && ACCESS_TOKEN_SUPPORT_CHAIN_IDS.includes(chainId)),
    [chainId],
  )

  const value = useMemo(() => {
    return {
      isStableSupported,
      isAccessTokenSupported,

    }
  }, [
    isStableSupported,
    isAccessTokenSupported,

  ])

  return <SwapFeaturesContext.Provider value={value}>{children}</SwapFeaturesContext.Provider>
}
