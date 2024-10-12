import { SerializedFarm, SerializedFarmConfig } from '@plexswap/farms'
import BigNumber from 'bignumber.js'
import { getFullDecimalMultiplier } from '@plexswap/utils/getFullDecimalMultiplier'
import { BIG_ZERO, BIG_TWO } from '@plexswap/utils/bigNumber'
import { fetchChiefFarmerData, PoolInfo, TotalRegularAllocPoint } from './fetchChiefFarmerData'
import { fetchPublicFarmsData } from './fetchPublicFarmData'

function getLpInfo({
  tokenBalanceLP,
  quoteTokenBalanceLP,
  lpTokenBalanceMC,
  lpTotalSupply,
  tokenDecimals,
  quoteTokenDecimals,
}) {
  const lpTotalSupplyBN = new BigNumber(lpTotalSupply)

  // Ratio in % of LP tokens that are staked in the MC, vs the total number in circulation
  const lpTokenRatio = new BigNumber(lpTokenBalanceMC).div(new BigNumber(lpTotalSupplyBN))

  // Raw amount of token in the LP, including those not staked
  const tokenAmountTotal = new BigNumber(tokenBalanceLP).div(getFullDecimalMultiplier(tokenDecimals))
  const quoteTokenAmountTotal = new BigNumber(quoteTokenBalanceLP).div(getFullDecimalMultiplier(quoteTokenDecimals))

  // Amount of quoteToken in the LP that are staked in the MC
  const quoteTokenAmountMc = quoteTokenAmountTotal.times(lpTokenRatio)

  // Total staked in LP, in quote token value
  const lpTotalInQuoteToken = quoteTokenAmountMc.times(BIG_TWO)

  return {
    tokenAmountTotal: tokenAmountTotal.toJSON(),
    quoteTokenAmountTotal: quoteTokenAmountTotal.toJSON(),
    lpTotalSupply: lpTotalSupplyBN.toJSON(),
    lpTotalInQuoteToken: lpTotalInQuoteToken.toJSON(),
    tokenPriceVsQuote: quoteTokenAmountTotal.div(tokenAmountTotal).toJSON(),
  }
}

function farmLpTransformer(farmResult, chiefFarmerResult: [PoolInfo, TotalRegularAllocPoint][]) {
  return (farm, index) => {
    const [tokenBalanceLP, quoteTokenBalanceLP, lpTokenBalanceMC, lpTotalSupply, tokenDecimals, quoteTokenDecimals] =
      farmResult[index].map((v: number | bigint) => v.toString())

    const [info, totalRegularAllocPoint] = chiefFarmerResult[index]
    const allocPoint = info ? new BigNumber(info[2].toString()) : BIG_ZERO
    const poolWeight = totalRegularAllocPoint
      ? allocPoint.div(new BigNumber(totalRegularAllocPoint.toString()))
      : BIG_ZERO

    return {
      ...farm,
      token: farm.token,
      quoteToken: farm.quoteToken,
      poolWeight: poolWeight.toJSON(),
      multiplier: `${allocPoint.div(10).toString()}X`,
      ...getLpInfo({
        tokenBalanceLP,
        quoteTokenBalanceLP,
        lpTokenBalanceMC,
        lpTotalSupply,
        tokenDecimals,
        quoteTokenDecimals,
      }),
    }
  }
}

const fetchFarms = async (farmsToFetch: SerializedFarmConfig[], chainId: number): Promise<SerializedFarm[]> => {
  const [farmResult, chiefFarmerResult] = await Promise.all([
    fetchPublicFarmsData(farmsToFetch, chainId),
    fetchChiefFarmerData(farmsToFetch, chainId),
  ])

  return farmsToFetch.map(farmLpTransformer(farmResult, chiefFarmerResult as [PoolInfo, TotalRegularAllocPoint][]))
}

export default fetchFarms
