import { deserializeToken } from '@plexswap/metalists'
import { Token } from '@plexswap/sdk-core'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import BigNumber from 'bignumber.js'
import {
  DeserializedPool,
  SerializedPoolAddon,
  SerializedWayaVault,
  DeserializedWayaVault,
  SerializedLockedWayaVault,
  VaultKey,
} from '@plexswap/pools'
import { safeGetAddress } from 'utils'
import { convertSharesToWaya } from 'views/Pools/helpers'

type UserData =
  | DeserializedPool<Token>['userData']
  | {
      allowance: number | string
      stakingTokenBalance: number | string
      stakedBalance: number | string
      pendingReward: number | string
    }

export const transformUserData = (userData: UserData) => {
  return {
    allowance: userData ? new BigNumber(userData.allowance) : BIG_ZERO,
    stakingTokenBalance: userData ? new BigNumber(userData.stakingTokenBalance) : BIG_ZERO,
    stakedBalance: userData ? new BigNumber(userData.stakedBalance) : BIG_ZERO,
    pendingReward: userData ? new BigNumber(userData.pendingReward) : BIG_ZERO,
  }
}

export const transformPool = (pool: SerializedPoolAddon): DeserializedPool<Token> => {
  const {
    totalStaked,
    stakingLimit,
    numberSecondsForUserLimit,
    userData,
    stakingToken,
    earningToken,
    startTimestamp,
    ...rest
  } = pool

  return {
    ...rest,
    startTimestamp,
    stakingToken: deserializeToken(stakingToken),
    earningToken: deserializeToken(earningToken),
    userData: transformUserData(userData),
    totalStaked: new BigNumber(totalStaked || '0'),
    stakingLimit: new BigNumber(stakingLimit || '0'),
    stakingLimitEndTimestamp: (numberSecondsForUserLimit || 0) + (startTimestamp || 0),
  }
}

export const transformVault = (vaultKey: VaultKey, vault: SerializedWayaVault): DeserializedWayaVault => {
  const {
    totalShares: totalSharesAsString,
    pricePerFullShare: pricePerFullShareAsString,
    fees: { performanceFee, withdrawalFee, withdrawalFeePeriod },
    userData: {
      isLoading,
      userShares: userSharesAsString,
      wayaAtLastUserAction: wayaAtLastUserActionAsString,
      lastDepositedTime,
      lastUserActionTime,
    },
  } = vault

  const totalShares = totalSharesAsString ? new BigNumber(totalSharesAsString) : BIG_ZERO
  const pricePerFullShare = pricePerFullShareAsString ? new BigNumber(pricePerFullShareAsString) : BIG_ZERO
  const userShares = new BigNumber(userSharesAsString)
  const wayaAtLastUserAction = new BigNumber(wayaAtLastUserActionAsString)
  let userDataExtra
  let publicDataExtra
  if (vaultKey === VaultKey.WayaVault) {
    const {
      totalWayaInVault: totalWayaInVaultAsString,
      totalLockedAmount: totalLockedAmountAsString,
      userData: {
        userBoostedShare: userBoostedShareAsString,
        lockEndTime,
        lockStartTime,
        locked,
        lockedAmount: lockedAmountAsString,
        currentOverdueFee: currentOverdueFeeAsString,
        currentPerformanceFee: currentPerformanceFeeAsString,
      },
    } = vault as SerializedLockedWayaVault

    const totalWayaInVault = new BigNumber(totalWayaInVaultAsString || '0')
    const totalLockedAmount = new BigNumber(totalLockedAmountAsString || '0')
    const lockedAmount = new BigNumber(lockedAmountAsString)
    const userBoostedShare = new BigNumber(userBoostedShareAsString)
    const currentOverdueFee = currentOverdueFeeAsString ? new BigNumber(currentOverdueFeeAsString) : BIG_ZERO
    const currentPerformanceFee = currentPerformanceFeeAsString
      ? new BigNumber(currentPerformanceFeeAsString)
      : BIG_ZERO

    const balance = convertSharesToWaya(
      userShares,
      pricePerFullShare,
      undefined,
      undefined,
      currentOverdueFee.plus(currentPerformanceFee).plus(userBoostedShare),
    )
    userDataExtra = {
      lockEndTime,
      lockStartTime,
      locked,
      lockedAmount,
      userBoostedShare,
      currentOverdueFee,
      currentPerformanceFee,
      balance,
    }
    publicDataExtra = { totalLockedAmount, totalWayaInVault }
  } else {
    const balance = convertSharesToWaya(userShares, pricePerFullShare)
    const { wayaAsBigNumber } = convertSharesToWaya(totalShares, pricePerFullShare)
    userDataExtra = { balance }
    publicDataExtra = { totalWayaInVault: wayaAsBigNumber }
  }

  const performanceFeeAsDecimal = performanceFee && performanceFee / 100

  return {
    totalShares,
    pricePerFullShare,
    ...publicDataExtra,
    fees: { performanceFee, withdrawalFee, withdrawalFeePeriod, performanceFeeAsDecimal },
    userData: {
      isLoading,
      userShares,
      wayaAtLastUserAction,
      lastDepositedTime,
      lastUserActionTime,
      ...userDataExtra,
    },
  }
}

export const getTokenPricesFromFarm = (
  farms: {
    quoteToken: { address: string }
    token: { address: string }
    quoteTokenPriceBusd: string
    tokenPriceBusd: string
  }[],
) => {
  return farms.reduce((prices, farm) => {
    const quoteTokenAddress = safeGetAddress(farm.quoteToken.address)
    const tokenAddress = safeGetAddress(farm.token.address)
    /* eslint-disable no-param-reassign */
    if (quoteTokenAddress && !prices[quoteTokenAddress]) {
      prices[quoteTokenAddress] = new BigNumber(farm.quoteTokenPriceBusd).toNumber()
    }
    if (tokenAddress && !prices[tokenAddress]) {
      prices[tokenAddress] = new BigNumber(farm.tokenPriceBusd).toNumber()
    }
    /* eslint-enable no-param-reassign */
    return prices
  }, {})
}
