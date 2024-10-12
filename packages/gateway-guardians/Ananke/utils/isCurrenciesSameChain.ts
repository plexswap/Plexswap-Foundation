import { ChainId } from '@plexswap/chains'
import { Currency } from '@plexswap/sdk-core'

export function isCurrenciesSameChain(...currencies: Currency[]) {
  // eslint-disable-next-line prefer-destructuring
  const chainId: ChainId | undefined = currencies[0]?.chainId
  for (const currency of currencies) {
    if (currency.chainId !== chainId) {
      return false
    }
  }
  return true
}
