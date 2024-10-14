import { Native } from '@plexswap/sdk-core'
import type { Currency } from '@plexswap/sdk-core'
import { bscTokens } from '@plexswap/tokens'
import { ASSET_CDN } from 'config/constants/endpoints'
import { Field } from 'state/buyCrypto/actions'
import { OnRampUnit } from './types'
import { NativeBtc } from './utils/NativeBtc'

export const SUPPORTED_ONRAMP_TOKENS = ['ETH', 'DAI', 'USDT', 'USDC', 'BUSD', 'BNB', 'WBTC']
export const DEFAULT_FIAT_CURRENCIES = ['USD', 'EUR', 'GBP', 'HKD', 'CAD', 'AUD', 'BRL', 'JPY', 'KRW', 'VND']
export const ABOUT_EQUAL = '≈'

export enum OnRampChainId {
  BSC = 56,
  BSC_TESTNET = 97,
}
export enum ONRAMP_PROVIDERS {
  MoonPay = 'MoonPay',
  Mercuryo = 'Mercuryo',
  Transak = 'Transak',
  Topper = 'Topper',
}

export enum FeeTypes {
  NetworkingFees = 'Networking Fees',
  ProviderFees = 'Provider Fees',
  ProviderRate = 'Rate',
}

const DEFAULT_FEE_TYPES = [FeeTypes.NetworkingFees, FeeTypes.ProviderFees, FeeTypes.ProviderRate]
const MERCURYO_FEE_TYPES = [FeeTypes.ProviderFees, FeeTypes.ProviderRate]

export const getIsNetworkEnabled = (network: OnRampChainId | undefined) => {
  if (typeof network === 'undefined') return false
  if (typeof network === 'number') return true
  return false
}

export const PROVIDER_ICONS = {
  [ONRAMP_PROVIDERS.MoonPay]: `${ASSET_CDN}/images/on-ramp-providers/moonpay.svg`,
  [ONRAMP_PROVIDERS.Mercuryo]: `${ASSET_CDN}/images/on-ramp-providers/mercuryo.svg`,
  [ONRAMP_PROVIDERS.Transak]: `${ASSET_CDN}/images/on-ramp-providers/transak.svg`,
  [ONRAMP_PROVIDERS.Topper]: `${ASSET_CDN}/images/on-ramp-providers/topper.png`,
} satisfies Record<keyof typeof ONRAMP_PROVIDERS, string>

export const providerFeeTypes: { [provider in ONRAMP_PROVIDERS]: FeeTypes[] } = {
  [ONRAMP_PROVIDERS.MoonPay]: DEFAULT_FEE_TYPES,
  [ONRAMP_PROVIDERS.Mercuryo]: MERCURYO_FEE_TYPES,
  [ONRAMP_PROVIDERS.Transak]: DEFAULT_FEE_TYPES,
  [ONRAMP_PROVIDERS.Topper]: DEFAULT_FEE_TYPES,
}

export const getNetworkDisplay = (chainId: number | undefined): string => {
  switch (chainId as OnRampChainId) {

    case OnRampChainId.BSC:
      return 'binance'
    default:
      return ''
  }
}

export const getNetworkFullName = (chainId: number | undefined): string => {
  switch (chainId as OnRampChainId) {
    case OnRampChainId.BSC:
      return 'Binance Smart Chain'
    default:
      return ''
  }
}

export const chainIdToMercuryoNetworkId: { [id: number]: string } = {
  [OnRampChainId.BSC]: 'BINANCESMARTCHAIN',
}

export const chainIdToMoonPayNetworkId: { [id: number]: string } = {
  [OnRampChainId.BSC]: '_bsc',
}

export const chainIdToTransakNetworkId: { [id: number]: string } = {
  [OnRampChainId.BSC]: 'bsc',
}

export const chainIdToTopperNetworkId: { [id: number]: string } = {
  0: 'bitcoin',
}

export const combinedNetworkIdMap: {
  [provider in keyof typeof ONRAMP_PROVIDERS]: { [id: number]: string }
} = {
  [ONRAMP_PROVIDERS.MoonPay]: chainIdToMoonPayNetworkId,
  [ONRAMP_PROVIDERS.Mercuryo]: chainIdToMercuryoNetworkId,
  [ONRAMP_PROVIDERS.Transak]: chainIdToTransakNetworkId,
  [ONRAMP_PROVIDERS.Topper]: chainIdToTopperNetworkId,
}

export const selectCurrencyField = (unit: OnRampUnit, mode: string) => {
  if (unit === OnRampUnit.Fiat) return mode === 'onramp-fiat' ? Field.OUTPUT : Field.INPUT
  return mode === 'onramp-fiat' ? Field.INPUT : Field.OUTPUT
}
export const formatQuoteDecimals = (quote: number | undefined, unit: OnRampUnit) => {
  if (!quote) return ''
  return unit === OnRampUnit.Crypto ? quote.toFixed(2) : quote.toFixed(5)
}
export const isNativeBtc = (currency: Currency | string | undefined) => {
  if (typeof currency === 'string') return Boolean(currency === 'BTC_0')
  return Boolean(currency?.chainId === 0)
}

export const getOnRampCryptoById = (id: string) => onRampCurrenciesMap[id]
export const getOnRampFiatById = (id: string) => fiatCurrencyMap[id]

export const isFiat = (unit: OnRampUnit) => unit === OnRampUnit.Fiat

export const fiatCurrencyMap: Record<string, { symbol: string; name: string }> = {
  USD: {
    name: 'United States Dollar',
    symbol: 'USD',
  },
  EUR: {
    name: 'Euro',
    symbol: 'EUR',
  },
  GBP: {
    name: 'Great British Pound',
    symbol: 'GBP',
  },
  HKD: {
    name: 'Hong Kong Dollar',
    symbol: 'HKD',
  },
  CAD: {
    name: 'Canadian Dollar',
    symbol: 'CAD',
  },
  AUD: {
    name: 'Australian Dollar',
    symbol: 'AUD',
  },
  BRL: {
    name: 'Brazilian Real',
    symbol: 'BRL',
  },
  JPY: {
    name: 'Japanese Yen',
    symbol: 'JPY',
  },
  KRW: {
    name: 'South Korean Won',
    symbol: 'KRW',
  },
  VND: {
    name: 'Vietnamese Dong',
    symbol: 'VND',
  },
}

export type OnRampCurrency = Currency | NativeBtc
export const onRampCurrencies: OnRampCurrency[] = [
  NativeBtc.onChain(),
  Native.onChain(OnRampChainId.BSC),
  bscTokens.usdt,
  bscTokens.usdc,
]

export const onRampCurrenciesMap: { [tokenSymbol: string]: Currency } = {
  BTC_0: NativeBtc.onChain(),
  BNB_56: Native.onChain(OnRampChainId.BSC),
  // Add more entries for other currencies as needed
  USDT_56: bscTokens.usdt,
  USDC_56: bscTokens.usdc,
}
