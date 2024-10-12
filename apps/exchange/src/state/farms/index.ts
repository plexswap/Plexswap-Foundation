import { ChainId, verifyBscNetwork } from '@plexswap/chains'
import { createFarmFetcher, SerializedFarm, SerializedFarmsState } from '@plexswap/farms'
import { getFarmConfig } from '@plexswap/farms/config'
import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit'
import type {
    UnknownAsyncThunkFulfilledAction,
    UnknownAsyncThunkPendingAction,
    UnknownAsyncThunkRejectedAction,
} from '@reduxjs/toolkit/dist/matchers'
import { getFarmsPriceHelperLpFiles } from 'config/constants/priceHelperLps'
import stringify from 'fast-json-stable-stringify'
import keyBy from 'lodash/keyBy'
import type { AppState } from 'state'
import { getViemClients } from 'utils/viem'
import { chains } from 'utils/wagmi'
import { Address } from 'viem'
import splitProxyFarms from 'views/Farms/components/YieldBooster/helpers/splitProxyFarms'
import { fetchStableFarmsAvgInfo, fetchCoreFarmsAvgInfo } from 'queries/farms'
import { resetUserState } from '../global/actions'
import { fetchChiefFarmerFarmPoolLength } from './fetchChiefFarmerData'
import {
    fetchFarmUserAllowances,
    fetchFarmUserEarnings,
    fetchFarmUserStakedBalances,
    fetchFarmUserTokenBalances,
    fetchFarmUserWayaWrapperConstants,
    fetchFarmUserWayaWrapperEarnings,
    fetchFarmUserWayaWrapperRewardPerSec,
    fetchFarmUserWayaWrapperStakedBalances,
    fetchFarmWayaWrapperUserAllowances,
} from './fetchFarmUser'

const fetchFarmPublicDataPkg = async ({
  pids,
  chainId,
  chain,
}): Promise<[SerializedFarm[], number, number, string, Record<string, number>]> => {
  const farmsConfig = await getFarmConfig(chainId)
  const farmsCanFetch = farmsConfig?.filter((farmConfig) => pids.includes(farmConfig.pid)) ?? []
  const priceHelperLpsConfig = getFarmsPriceHelperLpFiles(chainId)

  const { farmsWithPrice, poolLength, regularWayaPerBlock, totalRegularAllocPoint } = await farmFetcher.fetchFarms({
    chainId,
    isTestnet: chain.testnet,
    farms: farmsCanFetch.concat(priceHelperLpsConfig),
  })
  const farmAprs: Record<string, number> = {}
  try {
    const [farmsCoreAvgInfo, farmsStableAvgInfo] = await Promise.all([
      fetchCoreFarmsAvgInfo(chainId),
      fetchStableFarmsAvgInfo(chainId),
    ])

    const mergedFarmsAvgInfo = { ...farmsCoreAvgInfo, ...farmsStableAvgInfo }

    Object.keys(mergedFarmsAvgInfo).forEach((key) => {
      const tokenData = mergedFarmsAvgInfo[key]
      farmAprs[key] = parseFloat(tokenData.apr7d.multipliedBy(100).toFixed(2))
    })
  } catch (e) {
    console.error(e)
  }
  return [farmsWithPrice, poolLength, regularWayaPerBlock, totalRegularAllocPoint, farmAprs]
}

export const farmFetcher = createFarmFetcher(getViemClients)

const initialState: SerializedFarmsState = {
  data: [],
  chainId: undefined,
  loadArchivedFarmsData: false,
  userDataLoaded: false,
  wayaUserDataLoaded: false,
  totalRegularAllocPoint: '0',
  loadingKeys: {},
}

// Async thunks
export const fetchInitialFarmsData = createAsyncThunk<
  { data: SerializedFarm[]; chainId: number },
  { chainId: number },
  {
    state: AppState
  }
>('farms/fetchInitialFarmsData', async ({ chainId }) => {
  return getFarmConfig(chainId).then((farmDataList) => {
    return {
      data:
        farmDataList?.map((farm) => ({
          ...farm,
          userData: {
            allowance: '0',
            tokenBalance: '0',
            stakedBalance: '0',
            earnings: '0',
          },
        })) ?? [],
      chainId,
    }
  })
})

export const fetchFarmsPublicDataAsync = createAsyncThunk<
  [SerializedFarm[], number, number, string, Record<string, number>],
  { pids: number[]; chainId: number },
  {
    state: AppState
  }
>(
  'farms/fetchFarmsPublicDataAsync',
  async ({ pids, chainId }, { dispatch, getState }) => {
    const state = getState()
    if (state.farms.chainId !== chainId) {
      await dispatch(fetchInitialFarmsData({ chainId }))
    }
    const chain = chains.find((c) => c.id === chainId)
    if (!chain || !farmFetcher.isChainSupported(chain.id)) throw new Error('chain not supported')
    return fetchFarmPublicDataPkg({ pids, chainId, chain }).catch((error) => {
      console.error(error)
      throw error
    })
  },
  {
    condition: (arg, { getState }) => {
      const { farms } = getState()
      if (farms.loadingKeys[stringify({ type: fetchFarmsPublicDataAsync.typePrefix, arg })]) {
        console.debug('farms action is fetching, skipping here')
        return false
      }
      return true
    },
  },
)

interface FarmUserDataResponse {
  pid: number
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
  proxy?: {
    allowance: string
    tokenBalance: string
    stakedBalance: string
    earnings: string
  }
}

interface WayaUserDataResponse {
  pid: number
  allowance: string
  tokenBalance: string
  stakedBalance: string
  earnings: string
  rewardPerSecond: number
}

async function getBoostedFarmsStakeValue(farms, account, chainId, proxyAddress) {
  const [
    userFarmAllowances,
    userFarmTokenBalances,
    userStakedBalances,
    userFarmEarnings,
    proxyUserFarmAllowances,
    proxyUserStakedBalances,
    proxyUserFarmEarnings,
  ] = await Promise.all([
    fetchFarmUserAllowances(account, farms, chainId),
    fetchFarmUserTokenBalances(account, farms, chainId),
    fetchFarmUserStakedBalances(account, farms, chainId),
    fetchFarmUserEarnings(account, farms, chainId),
    // Proxy call
    fetchFarmUserAllowances(account, farms, chainId),
    fetchFarmUserStakedBalances(proxyAddress, farms, chainId),
    fetchFarmUserEarnings(proxyAddress, farms, chainId),
  ])

  const farmAllowances = userFarmAllowances.map((farmAllowance, index) => {
    return {
      pid: farms[index].pid,
      allowance: userFarmAllowances[index],
      tokenBalance: userFarmTokenBalances[index],
      stakedBalance: userStakedBalances[index],
      earnings: userFarmEarnings[index],
      proxy: {
        allowance: proxyUserFarmAllowances[index],
        // NOTE: Duplicate tokenBalance to maintain data structure consistence
        tokenBalance: userFarmTokenBalances[index],
        stakedBalance: proxyUserStakedBalances[index],
        earnings: proxyUserFarmEarnings[index],
      },
    }
  })

  return farmAllowances
}

async function getWayaWrapperFarmsStakeValue(farms, account, chainId) {
  const [
    userFarmAllowances,
    userFarmTokenBalances,
    { parsedStakedBalances: userStakedBalances, boostedAmounts, boosterMultiplier },
    userFarmEarnings,
    { boosterContractAddress, startTimestamp, endTimestamp },
    { rewardPerSec },
  ] = await Promise.all([
    fetchFarmWayaWrapperUserAllowances(account, farms, chainId),
    fetchFarmUserTokenBalances(account, farms, chainId),
    fetchFarmUserWayaWrapperStakedBalances(account, farms, chainId),
    fetchFarmUserWayaWrapperEarnings(account, farms, chainId),
    fetchFarmUserWayaWrapperConstants(farms, chainId),
    fetchFarmUserWayaWrapperRewardPerSec(farms, chainId),
  ])

  const normalFarmAllowances = farms.map((_, index) => {
    return {
      pid: farms[index].pid,
      allowance: userFarmAllowances[index],
      tokenBalance: userFarmTokenBalances[index],
      stakedBalance: userStakedBalances[index],
      earnings: userFarmEarnings[index],
      boosterMultiplier: boosterMultiplier[index],
      boostedAmounts: boostedAmounts[index],
      boosterContractAddress: boosterContractAddress[index],
      rewardPerSecond: rewardPerSec[index],
      startTimestamp: startTimestamp[index],
      endTimestamp: endTimestamp[index],
    }
  })

  return normalFarmAllowances
}

async function getWayaWrapperFarmsData(farms, chainId) {
  const [{ boosterContractAddress, startTimestamp, endTimestamp }, { rewardPerSec }] = await Promise.all([
    fetchFarmUserWayaWrapperConstants(farms, chainId),
    fetchFarmUserWayaWrapperRewardPerSec(farms, chainId),
  ])

  const normalFarmAllowances = farms.map((_, index) => {
    return {
      pid: farms[index].pid,
      boosterContractAddress: boosterContractAddress[index],
      rewardPerSecond: rewardPerSec[index],
      startTimestamp: startTimestamp[index],
      endTimestamp: endTimestamp[index],
    }
  })

  return normalFarmAllowances
}

async function getNormalFarmsStakeValue(farms, account, chainId) {
  const [userFarmAllowances, userFarmTokenBalances, userStakedBalances, userFarmEarnings] = await Promise.all([
    fetchFarmUserAllowances(account, farms, chainId),
    fetchFarmUserTokenBalances(account, farms, chainId),
    fetchFarmUserStakedBalances(account, farms, chainId),
    fetchFarmUserEarnings(account, farms, chainId),
  ])

  const normalFarmAllowances = userFarmAllowances.map((_, index) => {
    return {
      pid: farms[index].pid,
      allowance: userFarmAllowances[index],
      tokenBalance: userFarmTokenBalances[index],
      stakedBalance: userStakedBalances[index],
      earnings: userFarmEarnings[index],
    }
  })

  return normalFarmAllowances
}

export const fetchFarmUserDataAsync = createAsyncThunk<
  FarmUserDataResponse[],
  { account: Address; pids: number[]; proxyAddress?: Address; chainId: number },
  {
    state: AppState
  }
>(
  'farms/fetchFarmUserDataAsync',
  async ({ account, pids, proxyAddress, chainId }, { dispatch, getState }) => {
    const state = getState()
    if (state.farms.chainId !== chainId) {
      await dispatch(fetchInitialFarmsData({ chainId }))
    }
    const poolLength = state.farms.poolLength ?? (await fetchChiefFarmerFarmPoolLength(ChainId.BSC))
    const farmsConfig = await getFarmConfig(chainId)
    const farmsCanFetch =
      farmsConfig?.filter((farmConfig) => pids.includes(farmConfig.pid) && poolLength > farmConfig.pid) ?? []
    if (proxyAddress && farmsCanFetch?.length && verifyBscNetwork(chainId)) {
      const { normalFarms, farmsWithProxy } = splitProxyFarms(farmsCanFetch)

      const [proxyAllowances, normalAllowances] = await Promise.all([
        farmsWithProxy
          ? getBoostedFarmsStakeValue(farmsWithProxy, account, chainId, proxyAddress)
          : Promise.resolve([]),
        normalFarms ? getNormalFarmsStakeValue(normalFarms, account, chainId) : Promise.resolve([]),
      ])

      return [...proxyAllowances, ...normalAllowances]
    }

    return getNormalFarmsStakeValue(farmsCanFetch, account, chainId)
  },
  {
    condition: (arg, { getState }) => {
      const { farms } = getState()
      if (farms.loadingKeys[stringify({ type: fetchFarmUserDataAsync.typePrefix, arg })]) {
        console.debug('farms user action is fetching, skipping here')
        return false
      }
      return true
    },
  },
)

export const fetchWayaWrapperUserDataAsync = createAsyncThunk<
  WayaUserDataResponse[],
  { account: Address; pids: number[]; chainId: number },
  {
    state: AppState
  }
>(
  'farms/fetchWayaWrapperUserData',
  async ({ account, chainId, pids }, { dispatch, getState }) => {
    const state = getState()
    if (state.farms.chainId !== chainId) {
      await dispatch(fetchInitialFarmsData({ chainId }))
    }
    const farmsConfig = await getFarmConfig(chainId)
    const farmsCanFetch = farmsConfig?.filter((farmConfig) => pids.includes(farmConfig.pid)) ?? []
    if (farmsCanFetch?.length) {
      const normalAllowances = await getWayaWrapperFarmsStakeValue(farmsCanFetch, account, chainId)
      return normalAllowances
    }

    return getWayaWrapperFarmsStakeValue(farmsCanFetch, account, chainId)
  },
  {
    condition: (arg, { getState }) => {
      const { farms } = getState()
      if (farms.loadingKeys[stringify({ type: fetchFarmUserDataAsync.typePrefix, arg })]) {
        console.debug('farms with WayaWrapper user action is fetching, skipping here')
        return false
      }
      return true
    },
  },
)

export const fetchWayaWrapperDataAsync = createAsyncThunk<
  WayaUserDataResponse[],
  { pids: number[]; chainId: number },
  {
    state: AppState
  }
>(
  'farms/fetchWayaWrapperData',
  async ({ chainId, pids }, { dispatch, getState }) => {
    const state = getState()
    if (state.farms.chainId !== chainId) {
      await dispatch(fetchInitialFarmsData({ chainId }))
    }
    const farmsConfig = await getFarmConfig(chainId)
    const farmsCanFetch = farmsConfig?.filter((farmConfig) => pids.includes(farmConfig.pid)) ?? []
    if (farmsCanFetch?.length) {
      const normalAllowances = await getWayaWrapperFarmsData(farmsCanFetch, chainId)
      return normalAllowances
    }

    return getWayaWrapperFarmsData(farmsCanFetch, chainId)
  },
  {
    condition: (arg, { getState }) => {
      const { farms } = getState()
      if (farms.loadingKeys[stringify({ type: fetchFarmUserDataAsync.typePrefix, arg })]) {
        console.debug('farms with WayaWrapper is fetching, skipping here')
        return false
      }
      return true
    },
  },
)

type UnknownAsyncThunkFulfilledOrPendingAction =
  | UnknownAsyncThunkFulfilledAction
  | UnknownAsyncThunkPendingAction
  | UnknownAsyncThunkRejectedAction

export const serializeLoadingKey = (
  action: UnknownAsyncThunkFulfilledOrPendingAction,
  suffix: UnknownAsyncThunkFulfilledOrPendingAction['meta']['requestStatus'],
) => {
  const type = action.type.split(`/${suffix}`)[0]
  return stringify({
    arg: action.meta.arg,
    type,
  })
}

export const farmsSlice = createSlice({
  name: 'Farms',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(resetUserState, (state) => {
      state.data = state.data.map((farm) => {
        return {
          ...farm,
          userData: {
            allowance: '0',
            tokenBalance: '0',
            stakedBalance: '0',
            earnings: '0',
          },
          wayaUserData: {
            allowance: '0',
            tokenBalance: '0',
            stakedBalance: '0',
            earnings: '0',
            rewardPerSecond: 0,
          },
        }
      })
      state.userDataLoaded = false
      state.wayaUserDataLoaded = false
    })
    // Init farm data
    builder.addCase(fetchInitialFarmsData.fulfilled, (state, action) => {
      const { data, chainId } = action.payload
      state.data = data
      state.chainId = chainId
    })

    // Update farms with live data
    builder.addCase(fetchFarmsPublicDataAsync.fulfilled, (state, action) => {
      const [farmPayload, poolLength, regularWayaPerBlock, totalRegularAllocPoint, farmAprs] = action.payload
      const farmPayloadPidMap = keyBy(farmPayload, 'pid')

      state.data = state.data.map((farm) => {
        const liveFarmData = farmPayloadPidMap[farm.pid]
        return {
          ...farm,
          ...liveFarmData,
          ...(farmAprs[farm.lpAddress.toLowerCase()] && { lpRewardsApr: farmAprs[farm.lpAddress.toLowerCase()] }),
        }
      })
      state.poolLength = poolLength
      state.regularWayaPerBlock = regularWayaPerBlock
      state.totalRegularAllocPoint = totalRegularAllocPoint
    })

    // Update farms with user data
    builder.addCase(fetchFarmUserDataAsync.fulfilled, (state, action) => {
      const userDataMap = keyBy(action.payload, 'pid')
      state.data = state.data.map((farm) => {
        const userDataEl = userDataMap[farm.pid]
        if (userDataEl) {
          return { ...farm, userData: userDataEl }
        }
        return farm
      })
      state.userDataLoaded = true
    })
    // Update farms with WayaWrapper user data
    builder.addCase(fetchWayaWrapperUserDataAsync.fulfilled, (state, action) => {
      const userDataMap = keyBy(action.payload, 'pid')
      state.data = state.data.map((farm) => {
        const userDataEl = userDataMap[farm.pid]
        if (userDataEl) {
          return { ...farm, wayaUserData: userDataEl }
        }
        return farm
      })
      state.wayaUserDataLoaded = true
    })
    builder.addCase(fetchWayaWrapperDataAsync.fulfilled, (state, action) => {
      const userDataMap = keyBy(action.payload, 'pid')
      state.data = state.data.map((farm) => {
        const userDataEl = userDataMap[farm.pid]
        if (userDataEl) {
          return { ...farm, wayaPublicData: userDataEl }
        }
        return farm
      })
      state.wayaUserDataLoaded = true
    })

    builder.addMatcher(
      isAnyOf(
        fetchFarmUserDataAsync.pending,
        fetchFarmsPublicDataAsync.pending,
        fetchWayaWrapperUserDataAsync.pending,
        fetchWayaWrapperDataAsync.pending,
      ),
      (state, action) => {
        state.loadingKeys[serializeLoadingKey(action, 'pending')] = true
      },
    )
    builder.addMatcher(
      isAnyOf(
        fetchFarmUserDataAsync.fulfilled,
        fetchFarmsPublicDataAsync.fulfilled,
        fetchWayaWrapperDataAsync.fulfilled,
        fetchWayaWrapperUserDataAsync.fulfilled,
      ),
      (state, action) => {
        state.loadingKeys[serializeLoadingKey(action, 'fulfilled')] = false
      },
    )
    builder.addMatcher(
      isAnyOf(
        fetchFarmsPublicDataAsync.rejected,
        fetchFarmUserDataAsync.rejected,
        fetchWayaWrapperUserDataAsync.rejected,
        fetchWayaWrapperDataAsync.rejected,
      ),
      (state, action) => {
        state.loadingKeys[serializeLoadingKey(action, 'rejected')] = false
      },
    )
  },
})

export default farmsSlice.reducer
