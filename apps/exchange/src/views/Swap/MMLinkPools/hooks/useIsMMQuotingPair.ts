import { ChainId } from '@plexswap/chains'
import { PLEXSWAP_BSC_MM } from '@plexswap/metalists/react'
import { UnsafeCurrency } from 'config/constants/types'
import { ConnectorNames } from 'config/wallet'
import { ExtendEthereum } from 'global'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { selectorByUrlsAtom } from 'state/lists/hooks'
import { useAccount } from 'wagmi'
import { IS_SUPPORT_NATIVE_TOKEN, MM_STABLE_TOKENS_WHITE_LIST, NATIVE_CURRENCY_ADDRESS } from '../constants'
import { useIsMMSupportChain } from './useIsMMSupportChain'

const QUOTING_WHITE_LIST = {
  56: PLEXSWAP_BSC_MM,
}

export const useTokenList = (url?: string): Record<string, string> => {
  const listsByUrl = useAtomValue(selectorByUrlsAtom)
  const data = listsByUrl[url ?? '']
  const whiteList = useMemo(() => {
    const list = {}
    if (data?.current) {
      data?.current.tokens.forEach((d) => {
        list[d.address.toLowerCase()] = d.address.toLowerCase()
      })
    }
    return list
  }, [data])
  return whiteList
}

export const useIsMMQuotingPair = (inputCurrency: UnsafeCurrency, outputCurrency: UnsafeCurrency): boolean => {
  const { chainId } = useActiveChainId()
  const list = useTokenList(chainId ? QUOTING_WHITE_LIST[chainId] : undefined)
  const isMMSupportChain = useIsMMSupportChain()
  const { connector, isConnected } = useAccount()
  return useMemo(() => {
    if (!isMMSupportChain || !chainId || !list || !inputCurrency || !outputCurrency) return false
    if (
      isConnected &&
      (connector?.id === ConnectorNames.Blocto ||
        connector?.id === 'safe' ||
        Boolean((window.ethereum as ExtendEthereum)?.isBlocto))
    )
      return false
    if (
      chainId === ChainId.BSC &&
      inputCurrency.isToken &&
      outputCurrency.isToken &&
      MM_STABLE_TOKENS_WHITE_LIST[chainId][inputCurrency.address] &&
      MM_STABLE_TOKENS_WHITE_LIST[chainId][outputCurrency.address]
    )
      // use StableSwap for BSC
      return false
    if (
      list[
        (inputCurrency.isToken
          ? inputCurrency.address
          : IS_SUPPORT_NATIVE_TOKEN
          ? inputCurrency.wrapped.address
          : NATIVE_CURRENCY_ADDRESS
        ).toLowerCase()
      ] &&
      list[
        (outputCurrency.isToken
          ? outputCurrency.address
          : IS_SUPPORT_NATIVE_TOKEN
          ? inputCurrency.wrapped.address
          : NATIVE_CURRENCY_ADDRESS
        ).toLowerCase()
      ]
    )
      return true
    return false
  }, [isMMSupportChain, chainId, list, inputCurrency, outputCurrency, isConnected, connector?.id])
}