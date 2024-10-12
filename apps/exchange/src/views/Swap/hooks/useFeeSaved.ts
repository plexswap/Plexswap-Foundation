import { Currency, CurrencyAmount, ERC20Token } from '@plexswap/sdk-core'
import { ChainId } from '@plexswap/chains'
import { USDC, USDT, USDP } from '@plexswap/tokens'
import { parseNumberToFraction } from '@plexswap/utils/formatFractions'
import { BigNumber } from 'bignumber.js'
import { useCurrencyUsdPrice } from 'hooks/useCurrencyUsdPrice'
import { useStablecoinPrice } from 'hooks/useStablecoinPrice'
import { useMemo } from 'react'
import { multiplyPriceByAmount } from 'utils/prices'

const MAJOR_DEFINED_STABLE_COINS: {
  [chainId in ChainId]?: Array<ERC20Token | undefined>
} = {
  [ChainId.PLEXCHAIN]: [USDP[ChainId.PLEXCHAIN]],
  [ChainId.BSC]: [USDC[ChainId.BSC], USDT[ChainId.BSC]],
}

export const useFeeSaved = (inputAmount?: CurrencyAmount<Currency>, outputAmount?: CurrencyAmount<Currency>) => {
  const feeSavedAmount = useMemo(() => {
    if (!inputAmount || !outputAmount) return undefined

    const { chainId } = inputAmount.currency

    const majorDefinedStableCoins = MAJOR_DEFINED_STABLE_COINS[chainId as ChainId]
    if (!majorDefinedStableCoins) return undefined

    const zeroFee = [inputAmount.currency, outputAmount.currency].every((currency) =>
      majorDefinedStableCoins.some((coin) => coin?.equals(currency)),
    )

    if (zeroFee) return undefined

    return outputAmount.multiply(25).divide(10000)
  }, [inputAmount, outputAmount])

  const { data: outputCurrencyUSDPrice, isLoading } = useCurrencyUsdPrice(feeSavedAmount?.currency, {
    enabled: Boolean(feeSavedAmount),
  })
  const fallbackPrice = useStablecoinPrice(feeSavedAmount?.currency, {
    enabled: Boolean(feeSavedAmount) && !isLoading && !outputCurrencyUSDPrice,
  })
  const feeSavedUsdValue = useMemo(() => {
    if (!feeSavedAmount) return parseNumberToFraction(0)

    if (!outputCurrencyUSDPrice && !fallbackPrice) return parseNumberToFraction(0)

    if (fallbackPrice)
      return parseNumberToFraction(multiplyPriceByAmount(fallbackPrice, Number(feeSavedAmount.toExact())))

    return parseNumberToFraction(new BigNumber(feeSavedAmount?.toExact()).times(outputCurrencyUSDPrice ?? 0).toNumber())
  }, [feeSavedAmount, fallbackPrice, outputCurrencyUSDPrice])

  return {
    feeSavedAmount,
    feeSavedUsdValue,
  }
}
