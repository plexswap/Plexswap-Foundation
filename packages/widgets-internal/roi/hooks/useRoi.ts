import { Currency, CurrencyAmount, Fraction, ONE, Percent, ZERO } from "@plexswap/sdk-core";
import { formatFraction, parseNumberToFraction } from "@plexswap/utils/formatFractions";
import { FeeAmount, FeeCalculator } from "@plexswap/sdk-extended";
import { useMemo } from "react";

import { useRate } from "./useRate";

interface Params extends Omit<FeeParams, "amount" | "currency"> {
  stakeFor?: number; // num of days
  compoundEvery?: number;
  compoundOn?: boolean;
  currencyAUsdPrice?: number;
  currencyBUsdPrice?: number;
  amountA?: CurrencyAmount<Currency>;
  amountB?: CurrencyAmount<Currency>;
  wayaApr?: number;
  editWayaApr?: number;
  wayaPrice?: number;
}

export function useRoi({
  amountA,
  amountB,
  compoundEvery,
  currencyAUsdPrice,
  currencyBUsdPrice,
  stakeFor = 365,
  compoundOn,
  wayaApr,
  editWayaApr,
  ...rest
}: Params) {
  const fee24h = useFee24h({
    ...rest,
    amountA,
    amountB,
  });
  const principal = useMemo(
    () =>
      amountA &&
      amountB &&
      currencyAUsdPrice &&
      currencyBUsdPrice &&
      parseFloat(amountA.toExact()) * currencyAUsdPrice + parseFloat(amountB.toExact()) * currencyBUsdPrice,
    [amountA, amountB, currencyAUsdPrice, currencyBUsdPrice]
  );
  const { rate, apr, reward, apy } = useRate({
    interest: parseFloat(formatFraction(fee24h, 6) || "0"),
    principal,
    compoundEvery,
    compoundOn,
    stakeFor,
  });
  const fee = useMemo(() => parseNumberToFraction(reward, 18), [reward]);

  const {
    apr: wayaAprInPercent,
    apy: wayaApy,
    reward: originalWayaReward,
  } = useRate({
    interest: (wayaApr && principal && ((wayaApr / 100) * principal) / 365) ?? 0,
    principal,
    compoundEvery,
    compoundOn,
    stakeFor,
  });

  const {
    rate: wayaRate,
    reward: wayaReward,
    apr: editWayaAprInPercent,
    apy: editWayaApy,
  } = useRate({
    interest: (editWayaApr && principal && ((editWayaApr / 100) * principal) / 365) ?? 0,
    principal,
    compoundEvery,
    compoundOn,
    stakeFor,
  });

  const {
    apy: combinedApy,
    rate: combinedRate,
    reward: combinedReward,
  } = useRate({
    interest: parseFloat(formatFraction(fee24h, 6) || "0"),
    principal,
    compoundEvery,
    compoundOn,
    stakeFor,
    wayaInterest: (wayaApr && principal && ((wayaApr / 100) * principal) / 365) ?? 0,
  });

  return {
    fee,
    rate,
    apr,
    apy,
    wayaApr: wayaAprInPercent,
    editWayaApr: editWayaAprInPercent,
    wayaApy,
    editWayaApy,
    wayaRate,
    wayaReward,
    originalWayaReward,
    combinedApy,
    combinedRate,
    combinedReward,
  };
}

export interface FeeParams {
  // Amount of token user input
  amountA?: CurrencyAmount<Currency>;
  // Currency of the other token in the pool
  amountB?: CurrencyAmount<Currency>;
  tickLower?: number;
  tickUpper?: number;
  // Average 24h historical trading volume in USD
  volume24H?: number;

  // The reason of using price sqrt X96 instead of tick current is that
  // tick current may have rounding error since it's a floor rounding
  sqrtRatioX96?: bigint;
  // All ticks inside the pool
  mostActiveLiquidity?: bigint;
  // Fee tier of the pool, in hundreds of a bip, i.e. 1e-6
  fee?: FeeAmount;

  // Proportion of protocol fee
  protocolFee?: Percent;
}

const ZERO_FEE = new Fraction(ZERO, ONE);

export function useFee24h({
  amountA,
  amountB,
  tickLower,
  tickUpper,
  volume24H,
  sqrtRatioX96,
  mostActiveLiquidity,
  fee,
  protocolFee,
}: FeeParams) {
  return useMemo(() => {
    if (
      !amountA ||
      !amountB ||
      typeof tickLower !== "number" ||
      typeof tickUpper !== "number" ||
      !volume24H ||
      !sqrtRatioX96 ||
      !mostActiveLiquidity ||
      !fee
    ) {
      return ZERO_FEE;
    }
    const fee24h = FeeCalculator.getEstimatedLPFeeByAmounts({
      amountA,
      amountB,
      tickLower,
      tickUpper,
      volume24H,
      sqrtRatioX96,
      mostActiveLiquidity,
      fee,
      protocolFee,
    });
    return fee24h || ZERO_FEE;
  }, [amountA, amountB, tickLower, tickUpper, volume24H, sqrtRatioX96, mostActiveLiquidity, fee, protocolFee]);
}
