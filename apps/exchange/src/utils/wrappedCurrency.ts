import { ChainId } from '@plexswap/chains'
import { Currency, CurrencyAmount, Token, WNATIVE } from '@plexswap/sdk-core'

export { unwrappedToken } from '@plexswap/tokens'

export function wrappedCurrency(
  currency: Currency | undefined | null,
  chainId: ChainId | undefined,
): Token | undefined {
  return chainId && currency?.isNative ? WNATIVE[chainId] : currency?.isToken ? currency : undefined
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount<Currency> | undefined,
  chainId: ChainId | undefined,
): CurrencyAmount<Token> | undefined {
  const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId) : undefined
  return token && currencyAmount ? CurrencyAmount.fromRawAmount(token, currencyAmount.quotient) : undefined
}
