import { BIG_ZERO } from "@plexswap/utils/bigNumber";
import { getBalanceNumber, getDecimalAmount, getFullDisplayBalance } from "@plexswap/utils/formatBalance";
import BigNumber from "bignumber.js";

// min deposit and withdraw amount
export const MIN_LOCK_AMOUNT = new BigNumber(10000000000000);

export const ENABLE_EXTEND_LOCK_AMOUNT = new BigNumber(100000000000000);

export const convertSharesToWaya = (
  shares: BigNumber,
  wayaPerFullShare: BigNumber,
  decimals = 18,
  decimalsToRound = 3,
  fee?: BigNumber
) => {
  const sharePriceNumber = getBalanceNumber(wayaPerFullShare, decimals);
  const amountInWaya = new BigNumber(shares.multipliedBy(sharePriceNumber)).minus(fee || BIG_ZERO);
  const wayaAsNumberBalance = getBalanceNumber(amountInWaya, decimals);
  const wayaAsBigNumber = getDecimalAmount(new BigNumber(wayaAsNumberBalance), decimals);
  const wayaAsDisplayBalance = getFullDisplayBalance(amountInWaya, decimals, decimalsToRound);
  return { wayaAsNumberBalance, wayaAsBigNumber, wayaAsDisplayBalance };
};

export const getWayaVaultEarnings = (
  account: string,
  wayaAtLastUserAction: BigNumber,
  userShares: BigNumber,
  pricePerFullShare: BigNumber,
  earningTokenPrice: number,
  fee?: BigNumber
) => {
  const hasAutoEarnings = account && wayaAtLastUserAction?.gt(0) && userShares?.gt(0);
  const { wayaAsBigNumber } = convertSharesToWaya(userShares, pricePerFullShare);
  const autoWayaProfit = wayaAsBigNumber.minus(fee || BIG_ZERO).minus(wayaAtLastUserAction);
  const autoWayaToDisplay = autoWayaProfit.gte(0) ? getBalanceNumber(autoWayaProfit, 18) : 0;

  const autoUsdProfit = autoWayaProfit.times(earningTokenPrice);
  const autoUsdToDisplay = autoUsdProfit.gte(0) ? getBalanceNumber(autoUsdProfit, 18) : 0;
  return { hasAutoEarnings, autoWayaToDisplay, autoUsdToDisplay };
};

export default getWayaVaultEarnings;
