import { DeserializedFarm, DeserializedFarmsState, deserializeFarm, deserializeFarmUserData } from '@plexswap/farms'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { getBalanceAmount } from '@plexswap/utils/formatBalance'
import { createSelector } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import { State } from '../types'

const selectWayaFarm = (state: State) => state.farms.data.find((f) => f.pid === 1)
const selectFarmByKey = (key: string, value?: string | number) => (state: State) =>
  state.farms.data.find((f) => f[key] === value)

export const makeFarmFromPidSelector = (pid?: number) =>
  createSelector([selectFarmByKey('pid', pid)], (farm) => farm && deserializeFarm(farm))

export const makeBusdPriceFromPidSelector = (pid: number) =>
  createSelector([selectFarmByKey('pid', pid)], (farm) => {
    return farm && new BigNumber(farm.tokenPriceBusd || '0')
  })

export const makeUserFarmFromPidSelector = (pid: number) =>
  createSelector([selectFarmByKey('pid', pid)], (farm) => {
    const { allowance, tokenBalance, stakedBalance, earnings, proxy } = deserializeFarmUserData(farm)
    return {
      allowance,
      tokenBalance,
      stakedBalance,
      earnings,
      proxy,
    }
  })

export const priceWayaFromPidSelector = createSelector([selectWayaFarm], (wayaBnbFarm) => {
  const wayaPriceAsString = wayaBnbFarm?.tokenPriceBusd
  return new BigNumber(wayaPriceAsString || '0')
})

export const farmFromLpSymbolSelector = (lpSymbol: string) =>
  createSelector([selectFarmByKey('lpSymbol', lpSymbol)], (farm) => farm && deserializeFarm(farm))

export const makeLpTokenPriceFromLpSymbolSelector = (lpSymbol: string) =>
  createSelector([selectFarmByKey('lpSymbol', lpSymbol)], (farm) => {
    let lpTokenPrice = BIG_ZERO
    if (farm) {
      const lpTotalInQuoteToken = farm.lpTotalInQuoteToken ? new BigNumber(farm.lpTotalInQuoteToken) : BIG_ZERO
      const lpTotalSupply = farm.lpTotalSupply ? new BigNumber(farm.lpTotalSupply) : BIG_ZERO

      if (lpTotalSupply.gt(0) && lpTotalInQuoteToken.gt(0)) {
        const farmTokenPriceInUsd = new BigNumber(farm.tokenPriceBusd || '0')
        const tokenAmountTotal = farm.tokenAmountTotal ? new BigNumber(farm.tokenAmountTotal) : BIG_ZERO
        // Total value of base token in LP
        const valueOfBaseTokenInFarm = farmTokenPriceInUsd.times(tokenAmountTotal)
        // Double it to get overall value in LP
        const overallValueOfAllTokensInFarm = valueOfBaseTokenInFarm.times(2)
        // Divide total value of all tokens, by the number of LP tokens
        const totalLpTokens = getBalanceAmount(lpTotalSupply)
        lpTokenPrice = overallValueOfAllTokensInFarm.div(totalLpTokens)
      }
    }

    return lpTokenPrice
  })

function mapFarm(farms, chainId): DeserializedFarmsState {
  const deserializedFarmsData = farms.data
    .map(deserializeFarm)
    .filter((farm) => farm.token.chainId === chainId) as DeserializedFarm[]
  const { loadArchivedFarmsData, userDataLoaded, poolLength, regularWayaPerBlock, totalRegularAllocPoint } = farms

  return {
    data: deserializedFarmsData,
    loadArchivedFarmsData: Boolean(loadArchivedFarmsData),
    userDataLoaded: Boolean(userDataLoaded),
    poolLength: poolLength as number,
    regularWayaPerBlock: regularWayaPerBlock as number,
    totalRegularAllocPoint: totalRegularAllocPoint as string,
  }
}

const selectFarms = (state: State) => state.farms

export const farmSelector = (chainId?: number) => createSelector([selectFarms], (farms) => mapFarm(farms, chainId))
