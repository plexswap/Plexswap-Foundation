import { ChainId } from '@plexswap/chains'
import { nativeStableLpMap } from '@plexswap/farms'
import { getFarmsPrices } from '@plexswap/farms/farmPrices'
import { bscTokens } from '@plexswap/tokens'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { getBalanceNumber } from '@plexswap/utils/formatBalance'
import { getCurrencyUsdPrice } from '@plexswap/trade-sentinels/Valorus'
import { PayloadAction, createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import {
  PoolsState,
  SerializedLockedVaultUser,
  SerializedLockedWayaVault,
  SerializedVaultFees,
  SerializedVaultUser,
  SerializedWayaVault,
  SerializedPoolAddon,
  getPoolsConfig,
  fetchPublicVaultData, 
  fetchVaultFees, 
  fetchPublicFlexibleVaultData, 
  fetchVaultUser,
  getPoolAprByTokenPerBlock, 
  fetchFlexibleVaultUser,
  fetchPoolsAllowance,
  fetchUserBalances,
  fetchUserPendingRewards,
  fetchUserStakeBalances,
  fetchPoolsTimeLimits, 
  fetchPoolsStakingLimits, 
  fetchPoolsTotalStaking
} from '@plexswap/pools'
import { farmExtendedApiFetch } from 'state/farmsExtended/hooks'
import { getPoolsPriceHelperLpFiles } from 'config/constants/priceHelperLps'
import { getWayaPriceFromOracle } from 'hooks/useWayaPrice'
import keyBy from 'lodash/keyBy'
import orderBy from 'lodash/orderBy'
import { safeGetAddress } from 'utils'
import { getWayaVaultAddress, getWayaFlexibleVaultAddress } from 'utils/addressHelpers'
import { getViemClients } from 'utils/viem'
import { publicClient } from 'utils/wagmi'
import { Address, erc20Abi } from 'viem'
import fetchFarms from '../farms/fetchFarms'
import { resetUserState } from '../global/actions'
import { getTokenPricesFromFarm } from './helpers'

export const initialPoolVaultState = Object.freeze({
  totalShares: null,
  totalLockedAmount: null,
  pricePerFullShare: null,
  totalWayaInVault: null,
  fees: {
    performanceFee: null,
    withdrawalFee: null,
    withdrawalFeePeriod: null,
  },
  userData: {
    isLoading: true,
    userShares: null,
    wayaAtLastUserAction: null,
    lastDepositedTime: null,
    lastUserActionTime: null,
    credit: null,
    locked: null,
    lockStartTime: null,
    lockEndTime: null,
    userBoostedShare: null,
    lockedAmount: null,
    currentOverdueFee: null,
    currentPerformanceFee: null,
  },
  creditStartBlock: null,
})

const initialState: PoolsState = {
  data: [],
  userDataLoaded: false,
  wayaVault: initialPoolVaultState as any,
  wayaFlexibleVault: initialPoolVaultState as any,
}

export const fetchWayaPoolPublicDataAsync = () => async (dispatch) => {
  const wayaPrice = parseFloat(await getWayaPriceFromOracle())

  const stakingTokenPrice = wayaPrice
  const earningTokenPrice = wayaPrice

  dispatch(
    setPoolPublicData({
      poolId: 0,
      data: {
        stakingTokenPrice,
        earningTokenPrice,
      },
    }),
  )
}

export const fetchWayaPoolUserDataAsync =
  ({ account, chainId }: { account: string; chainId: ChainId }) =>
  async (dispatch) => {
    const client = publicClient({ chainId: ChainId.BSC })
    const [allowance, stakingTokenBalance] = await client.multicall({
      contracts: [
        {
          abi: erc20Abi,
          address: bscTokens.waya.address,
          functionName: 'allowance',
          args: [account as Address, getWayaVaultAddress(chainId)],
        },
        {
          abi: erc20Abi,
          address: bscTokens.waya.address,
          functionName: 'balanceOf',
          args: [account as Address],
        },
      ],
      allowFailure: false,
    })

    dispatch(
      setPoolUserData({
        poolId: 0,
        data: {
          allowance: new BigNumber(allowance.toString()).toJSON(),
          stakingTokenBalance: new BigNumber(stakingTokenBalance.toString()).toJSON(),
        },
      }),
    )
  }

export const fetchPoolsPublicDataAsync = (chainId: number) => async (dispatch, getState) => {
  try {
    const [block, timeLimits] = await Promise.all([
      getViemClients({ chainId })?.getBlock({ blockTag: 'latest' }),
      fetchPoolsTimeLimits(chainId, getViemClients),
    ])
    const timeLimitsPoolIdMap = keyBy(timeLimits, 'poolId')
    const priceHelperLpsConfig = getPoolsPriceHelperLpFiles(chainId)
    const poolsConfig = getPoolsConfig(chainId) || []
    const activePriceHelperLpsConfig = priceHelperLpsConfig.filter((priceHelperLpConfig) => {
      return (
        poolsConfig
          .filter((pool) => pool.earningToken.address.toLowerCase() === priceHelperLpConfig.token.address.toLowerCase())
          .filter((pool) => {
            const poolTimeLimit = timeLimitsPoolIdMap[pool.poolId]
            if (poolTimeLimit) {
              return poolTimeLimit.endTimestamp > Number(block?.timestamp)
            }
            return false
          }).length > 0
      )
    })

    const fetchFarmExtendedPromise = farmExtendedApiFetch(chainId)
      .then((result) => result?.farmsWithPrice || [])
      .catch(() => {
        return []
      })

    const [totalStakings, poolsWithDifferentFarmToken, farmsExtendedData] = await Promise.all([
      fetchPoolsTotalStaking(chainId, getViemClients),
      activePriceHelperLpsConfig.length > 0 ? fetchFarms(priceHelperLpsConfig, chainId) : Promise.resolve([]),
      fetchFarmExtendedPromise,
    ])

    const totalStakingsPoolIdMap = keyBy(totalStakings, 'poolId')

    const farmsCoreData = getState().farms.data
    const bnbBusdFarms =
      activePriceHelperLpsConfig.length > 0
        ? [...orderBy(farmsExtendedData, 'lmPoolLiquidity', 'desc'), ...farmsCoreData].filter(
            (farm) => farm.token.symbol === 'BUSD' && farm.quoteToken.symbol === 'WBNB',
          )
        : []
    const farmsWithPricesOfDifferentTokenPools =
      bnbBusdFarms.length > 0
        ? getFarmsPrices([...bnbBusdFarms, ...poolsWithDifferentFarmToken], nativeStableLpMap[chainId], 18)
        : []

    const prices = getTokenPricesFromFarm([...farmsCoreData, ...farmsExtendedData, ...farmsWithPricesOfDifferentTokenPools])

    const liveData: any[] = []

    for (const pool of poolsConfig) {
      const timeLimit = timeLimitsPoolIdMap[pool.poolId]
      const totalStaking = totalStakingsPoolIdMap[pool.poolId]
      const isPoolEndBlockExceeded =
        block.timestamp > 0 && timeLimit ? block.timestamp > Number(timeLimit.endTimestamp) : false
      const isPoolFinished = pool.isFinished || isPoolEndBlockExceeded

      const stakingTokenAddress = safeGetAddress(pool.stakingToken.address)
      let stakingTokenPrice = stakingTokenAddress ? prices[stakingTokenAddress] : 0
      if (stakingTokenAddress && !prices[stakingTokenAddress] && !isPoolFinished) {
          // eslint-disable-next-line no-await-in-loop
          stakingTokenPrice = await getCurrencyUsdPrice({ chainId, address: stakingTokenAddress })
      }

      const earningTokenAddress = safeGetAddress(pool.earningToken.address)
      let earningTokenPrice = earningTokenAddress ? prices[earningTokenAddress] : 0
      if (earningTokenAddress && !prices[earningTokenAddress] && !isPoolFinished) {
        // eslint-disable-next-line no-await-in-loop
        earningTokenPrice = await getCurrencyUsdPrice({ chainId, address: earningTokenAddress })
      }
      const totalStaked = getBalanceNumber(new BigNumber(totalStaking.totalStaked), pool.stakingToken.decimals)
      const apr = !isPoolFinished
        ? getPoolAprByTokenPerBlock(stakingTokenPrice, earningTokenPrice, totalStaked, parseFloat(pool.tokenPerBlock))
        : 0

      liveData.push({
        ...timeLimit,
        ...totalStaking,
        stakingTokenPrice,
        earningTokenPrice,
        apr,
        isFinished: isPoolFinished,
      })
    }

    dispatch(setPoolsPublicData(liveData || []))
  } catch (error) {
    console.error('[Pools Action] error when getting public data', error)
  }
}

export const fetchPoolsStakingLimitsAsync = (chainId: ChainId) => async (dispatch, getState) => {
  const poolsWithStakingLimit = getState()
    .pools.data.filter(({ stakingLimit }) => stakingLimit !== null && stakingLimit !== undefined)
    .map((pool) => pool.poolId)

  try {
    const stakingLimits = await fetchPoolsStakingLimits({ poolsWithStakingLimit, chainId, provider: getViemClients })

    const poolsConfig = getPoolsConfig(chainId)
    const stakingLimitData = poolsConfig?.map((pool) => {
      if (poolsWithStakingLimit.includes(pool.poolId)) {
        return { poolId: pool.poolId }
      }
      const { stakingLimit, numberSecondsForUserLimit } = stakingLimits[pool.poolId] || {
        stakingLimit: BIG_ZERO,
        numberSecondsForUserLimit: 0,
      }
      return {
        poolId: pool.poolId,
        stakingLimit: stakingLimit.toJSON(),
        numberSecondsForUserLimit,
      }
    })
    if (stakingLimitData) {
      dispatch(setPoolsPublicData(stakingLimitData))
    }
  } catch (error) {
    console.error('[Pools Action] error when getting staking limits', error)
  }
}

export const fetchPoolsUserDataAsync = createAsyncThunk<
  { poolId: number; allowance: any; stakingTokenBalance: any; stakedBalance: any; pendingReward: any }[],
  {
    account: string
    chainId: ChainId
  }
>('pool/fetchPoolsUserData', async ({ account, chainId }: any, { rejectWithValue }: any) => {
  try {
    const [allowances, stakingTokenBalances, stakedBalances, pendingRewards] = await Promise.all([
      fetchPoolsAllowance({ account, chainId, provider: getViemClients }),
      fetchUserBalances({ account, chainId, provider: getViemClients }),
      fetchUserStakeBalances({ account, chainId, provider: getViemClients }),
      fetchUserPendingRewards({ account, chainId, provider: getViemClients }),
    ])

    const poolsConfig = getPoolsConfig(chainId)
    const userData = poolsConfig?.map((pool) => ({
      poolId: pool.poolId,
      allowance: allowances[pool.poolId],
      stakingTokenBalance: stakingTokenBalances[pool.poolId],
      stakedBalance: stakedBalances[pool.poolId],
      pendingReward: pendingRewards[pool.poolId],
    }))
    return userData
  } catch (e) {
    return rejectWithValue(e)
  }
})

export const updateUserAllowance = createAsyncThunk<
  { poolId: number; field: string; value: any },
  { poolId: number; account: string; chainId: ChainId }
>('pool/updateUserAllowance', async ({ poolId, account, chainId }) => {
  const allowances = await fetchPoolsAllowance({ account, chainId, provider: getViemClients })
  return { poolId, field: 'allowance', value: allowances[poolId] }
})

export const updateUserBalance = createAsyncThunk<
  { poolId: number; field: string; value: any },
  { poolId: number; account: string; chainId: ChainId }
>('pool/updateUserBalance', async ({ poolId, account, chainId }) => {
  const tokenBalances = await fetchUserBalances({ account, chainId, provider: getViemClients })
  return { poolId, field: 'stakingTokenBalance', value: tokenBalances[poolId] }
})

export const updateUserStakedBalance = createAsyncThunk<
  { poolId: number; field: string; value: any },
  { poolId: number; account: string; chainId: ChainId }
>('pool/updateUserStakedBalance', async ({ poolId, account, chainId }) => {
  const stakedBalances = await fetchUserStakeBalances({ account, chainId, provider: getViemClients })
  return { poolId, field: 'stakedBalance', value: stakedBalances[poolId] }
})

export const updateUserPendingReward = createAsyncThunk<
  { poolId: number; field: string; value: any },
  { poolId: number; account: string; chainId: ChainId }
>('pool/updateUserPendingReward', async ({ poolId, account, chainId }) => {
  const pendingRewards = await fetchUserPendingRewards({ chainId, account, provider: getViemClients })
  return { poolId, field: 'pendingReward', value: pendingRewards[poolId] }
})

export const fetchWayaVaultPublicData = createAsyncThunk<SerializedLockedWayaVault, ChainId>(
  'wayaVault/fetchPublicData',
  async (chainId: any): Promise<any> => {
    const publicVaultInfo = await fetchPublicVaultData({ chainId, provider: getViemClients })
    return publicVaultInfo
  },
)

export const fetchWayaFlexibleVaultPublicData = createAsyncThunk<SerializedWayaVault, ChainId>(
  'wayaFlexibleVault/fetchPublicData',
  async (chainId: any): Promise<any> => {
    const publicVaultInfo = await fetchPublicFlexibleVaultData({ chainId, provider: getViemClients })
    return publicVaultInfo
  },
)

export const fetchWayaVaultFees = createAsyncThunk<SerializedVaultFees, ChainId>(
  'wayaVault/fetchFees',
  async (chainId: any): Promise<any> => {
    const vaultFees = await fetchVaultFees({
      chainId,
      provider: getViemClients,
      wayaVaultAddress: getWayaVaultAddress(chainId),
    })
    return vaultFees
  },
)

export const fetchWayaFlexibleVaultFees = createAsyncThunk<SerializedVaultFees, ChainId>(
  'wayaFlexibleVault/fetchFees',
  async (chainId: any): Promise<any> => {
    const vaultFees = await fetchVaultFees({
      chainId,
      provider: getViemClients,
      wayaVaultAddress: getWayaFlexibleVaultAddress(chainId),
    })
    return vaultFees
  },
)

export const fetchWayaVaultUserData = createAsyncThunk<
  SerializedLockedVaultUser,
  { account: Address; chainId: ChainId }
>('wayaVault/fetchUser', async ({ account, chainId }) => {
  const userData = await fetchVaultUser({ account, chainId, provider: getViemClients })
  return userData
})

export const fetchWayaFlexibleVaultUserData = createAsyncThunk<
  SerializedVaultUser,
  { account: Address; chainId: ChainId }
>('wayaFlexibleVault/fetchUser', async ({ account, chainId }) => {
  const userData = await fetchFlexibleVaultUser({ chainId, account, provider: getViemClients })
  return userData
})

export const PoolsSlice = createSlice({
  name: 'Pools',
  initialState,
  reducers: {
    setInitialPoolConfig: (state, action) => {
      const { chainId } = action.payload
      const poolsConfig = getPoolsConfig(chainId) || []
      state.data = [...poolsConfig]
      state.userDataLoaded = false
      state.wayaVault = initialPoolVaultState as any
      state.wayaFlexibleVault = initialPoolVaultState as any
    },
    setPoolPublicData: (state, action) => {
      const { poolId } = action.payload
      const poolIndex = state.data.findIndex((pool) => pool.poolId === poolId)
      state.data[poolIndex] = {
        ...state.data[poolIndex],
        ...action.payload.data,
      }
    },
    setPoolUserData: (state, action) => {
      const { poolId } = action.payload
      state.data = state.data.map((pool) => {
        if (pool.poolId === poolId) {
          return { ...pool, userDataLoaded: true, userData: action.payload.data }
        }
        return pool
      })
    },
    setPoolsPublicData: (state, action) => {
      const livePoolsData: SerializedPoolAddon[] = action.payload
      const livePoolsPoolIdMap = keyBy(livePoolsData, 'poolId')
      state.data = state.data.map((pool) => {
        const livePoolData = livePoolsPoolIdMap[pool.poolId]
        return { ...pool, ...livePoolData }
      })
    },
  },
  extraReducers: (builder) => {
    builder.addCase(resetUserState, (state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      state.data = state.data.map(({ userData, ...pool }) => {
        return { ...pool }
      })
      state.userDataLoaded = false
      state.wayaVault = { ...state.wayaVault, userData: initialPoolVaultState.userData as any }
      state.wayaFlexibleVault = { ...state.wayaFlexibleVault, userData: initialPoolVaultState.userData as any }
    })
    builder.addCase(
      fetchPoolsUserDataAsync.fulfilled,
      (
        state,
        action: PayloadAction<
          { poolId: number; allowance: any; stakingTokenBalance: any; stakedBalance: any; pendingReward: any }[]
        >,
      ) => {
        const userData = action.payload
        const userDataPoolIdMap = keyBy(userData, 'poolId')
        state.data = state.data.map((pool) => ({
          ...pool,
          userDataLoaded: true,
          userData: userDataPoolIdMap[pool.poolId],
        }))
        state.userDataLoaded = true
      },
    )
    builder.addCase(fetchPoolsUserDataAsync.rejected, (state, action) => {
      console.error('[Pools Action] Error fetching pool user data', action.payload)
    })
    // Vault public data that updates frequently
    builder.addCase(fetchWayaVaultPublicData.fulfilled, (state, action: PayloadAction<SerializedLockedWayaVault>) => {
      state.wayaVault = { ...state.wayaVault, ...action.payload }
    })
    builder.addCase(
      fetchWayaFlexibleVaultPublicData.fulfilled,
      (state, action: PayloadAction<SerializedWayaVault>) => {
        state.wayaFlexibleVault = { ...state.wayaFlexibleVault, ...action.payload }
      },
    )
    // Vault fees
    builder.addCase(fetchWayaVaultFees.fulfilled, (state, action: PayloadAction<SerializedVaultFees>) => {
      const fees = action.payload
      state.wayaVault = { ...state.wayaVault, fees }
    })
    builder.addCase(fetchWayaFlexibleVaultFees.fulfilled, (state, action: PayloadAction<SerializedVaultFees>) => {
      const fees = action.payload
      state.wayaFlexibleVault = { ...state.wayaFlexibleVault, fees }
    })
    // Vault user data
    builder.addCase(fetchWayaVaultUserData.fulfilled, (state, action: PayloadAction<SerializedLockedVaultUser>) => {
      const userData = action.payload
      state.wayaVault = { ...state.wayaVault, userData }
    })

   builder.addCase(
      fetchWayaFlexibleVaultUserData.fulfilled,
      (state, action: PayloadAction<SerializedVaultUser>) => {
        const userData = action.payload
        state.wayaFlexibleVault = { ...state.wayaFlexibleVault, userData }
      },
    )
    builder.addMatcher(
      isAnyOf(
        updateUserAllowance.fulfilled,
        updateUserBalance.fulfilled,
        updateUserStakedBalance.fulfilled,
        updateUserPendingReward.fulfilled,
      ),
      (state, action: PayloadAction<{ poolId: number; field: string; value: any }>) => {
        const { field, value, poolId } = action.payload
        const index = state.data.findIndex((p) => p.poolId === poolId)

        if (index >= 0) {
          state.data[index] = {
            ...state.data[index],
            userData: { ...state.data[index].userData, [field]: value } as any,
          }
        }
      },
    )
  },
})

// Actions
export const { setPoolsPublicData, setPoolPublicData, setPoolUserData, setInitialPoolConfig } = PoolsSlice.actions

export default PoolsSlice.reducer