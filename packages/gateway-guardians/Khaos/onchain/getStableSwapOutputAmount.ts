import { ChainId } from '@plexswap/chains'
import { Currency, CurrencyAmount } from '@plexswap/sdk-core'

import { stableSwapPairABI } from '../../config/abis/StableSwapPair'
import { wrappedCurrencyAmount } from '../../base/utils/currency'
import { Provider, StableSwapPair } from '../types'
import { getOutputToken } from '../utils/pair'

interface Options {
  provider: Provider
}

export async function getStableSwapOutputAmount(
  pair: StableSwapPair,
  inputAmount: CurrencyAmount<Currency>,
  { provider }: Options,
): Promise<CurrencyAmount<Currency>> {
  const wrappedInputAmount = wrappedCurrencyAmount(inputAmount, inputAmount.currency.chainId)
  if (!wrappedInputAmount) {
    throw new Error(`No wrapped token amount found for input amount: ${inputAmount.currency.name}`)
  }

  // eslint-disable-next-line prefer-destructuring
  const chainId: ChainId = inputAmount.currency.chainId
  const inputToken = wrappedInputAmount.currency
  const outputToken = getOutputToken(pair, inputToken)
  const inputRawAmount = inputAmount.wrapped.quotient

  const isOutputToken0 = pair.token0.equals(outputToken)
  const args = isOutputToken0 ? ([1n, 0n, inputRawAmount] as const) : ([0n, 1n, inputRawAmount] as const)

  const client = provider({ chainId })
  const [result] = await client.multicall({
    contracts: [
      {
        abi: stableSwapPairABI,
        address: pair.stableSwapAddress,
        functionName: 'get_dy',
        args,
      },
    ],
    allowFailure: false,
  })

  return CurrencyAmount.fromRawAmount(outputToken, result)
}
