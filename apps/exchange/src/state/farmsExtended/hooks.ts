import { ChainId } from '@plexswap/chains'
import {
    FarmExtendedDataWithPrice,
    FarmExtendedDataWithPriceAndUserInfo,
    FarmExtendedDataWithPriceTVL,
    FarmsExtendedResponse,
    IPendingWayaByTokenId,
    PositionDetails,
    SerializedFarmsExtendedResponse,
    createFarmFetcherExtended,
    extendedFarmSupportedChainId,
    wayaSupportedChainId,
} from '@plexswap/farms'
import { priceHelperTokens } from '@plexswap/farms/config/common'
import { farmsExtendedConfigChainMap } from '@plexswap/farms/config/extended'
import { farmBoosterVoterABI } from '@plexswap/farms/config/extended/abi/FarmBoosterVoter'
import { TvlMap, fetchCommonTokenUSDValue } from '@plexswap/farms/src/fetchFarmsExtended'
import { deserializeToken } from '@plexswap/metalists'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { FAST_INTERVAL } from 'config/constants'
import { FARMS_API } from 'config/constants/endpoints'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useWayaPrice } from 'hooks/useWayaPrice'
import { chiefFarmerExtendedABI } from '@plexswap/sdk-extended'
import BN from 'bignumber.js'
import { useChieffarmerExtended, useExtendedNFTPositionManagerContract, useFarmBoosterVoterContract } from 'hooks/useContract'
import { useExtendedPositionsFromTokenIds, useExtendedTokenIdsByAccount } from 'hooks/extended/useExtendedPositions'
import toLower from 'lodash/toLower'
import { useMemo } from 'react'
import fetchWithTimeout from 'utils/fetchWithTimeout'
import { getViemClients } from 'utils/viem'
import { publicClient } from 'utils/wagmi'
import { Hex, decodeFunctionResult, encodeFunctionData } from 'viem'
import { useAccount } from 'wagmi'

export const farmExtendedApiFetch = (chainId: number): Promise<FarmsExtendedResponse> =>
  fetch(`/api/extended/${chainId}/farms`)
    .then((res) => res.json())
    .then((data: SerializedFarmsExtendedResponse) => {
      const farmsWithPrice = data.farmsWithPrice.map((f) => ({
        ...f,
        token: deserializeToken(f.token),
        quoteToken: deserializeToken(f.quoteToken),
      }))

      return {
        chainId,
        ...data,
        farmsWithPrice,
      }
    })

const fallback: Awaited<ReturnType<typeof farmFetcherExtended.fetchFarms>> = {
  chainId: ChainId.BSC,
  farmsWithPrice: [],
  poolLength: 0,
  wayaPerSecond: '0',
  totalAllocPoint: '0',
}

const API_FLAG = false

const farmFetcherExtended = createFarmFetcherExtended(getViemClients)

export const useFarmsExtendedPublic = () => {
  const { chainId } = useActiveChainId()

  return useQuery({
    queryKey: [chainId, 'farmExtendedApiFetch'],

    queryFn: async () => {
      if (API_FLAG && chainId) {
        return farmExtendedApiFetch(chainId).catch((err) => {
          console.error(err)
          return fallback
        })
      }

      // direct copy from api routes, the client side fetch is preventing cache due to migration phase we want fresh data
      const farms = farmsExtendedConfigChainMap[chainId as ChainId]

      const commonPrice = await fetchCommonTokenUSDValue(priceHelperTokens[chainId ?? -1])

      try {
        const data = await farmFetcherExtended.fetchFarms({
          chainId: chainId ?? -1,
          farms,
          commonPrice,
        })

        return data
      } catch (error) {
        console.error(error)
        // return fallback for now since not all chains supported
        return fallback
      }
    },

    enabled: Boolean(farmFetcherExtended.isChainSupported(chainId ?? -1)),
    refetchInterval: FAST_INTERVAL * 3,
    initialData: fallback,
  })
}

interface UseFarmsOptions {
  // mock apr when tvl is 0
  mockApr?: boolean
}

export const useFarmsExtended = ({ mockApr = false }: UseFarmsOptions = {}) => {
  const { chainId } = useActiveChainId()

  const farmExtended = useFarmsExtendedPublic()

  const wayaPrice = useWayaPrice()

  const { data } = useQuery({
    queryKey: [chainId, 'waya-apr-tvl'],

    queryFn: async ({ signal }) => {
      if (chainId !== farmExtended?.data.chainId) {
        throw new Error('ChainId mismatch')
      }
      const tvls: TvlMap = {}
      if (extendedFarmSupportedChainId.includes(chainId)) {
        const farmsToFetch = farmExtended.data.farmsWithPrice.filter((f) => f.poolWeight !== '0')
        const results = await Promise.allSettled(
          farmsToFetch.map((f) =>
            fetchWithTimeout(`${FARMS_API}/extended/${chainId}/liquidity/${f.lpAddress}`, {
              signal,
            })
              .then((r) => r.json())
              .catch((err) => {
                console.error(err)
                throw err
              }),
          ),
        )
        results.forEach((r, i) => {
          tvls[farmsToFetch[i].lpAddress] =
            r.status === 'fulfilled' ? { ...r.value.formatted, updatedAt: r.value.updatedAt } : null
        })
      }

      const farmWithPriceAndWayaAPR = farmExtended.data.farmsWithPrice.map((f) => {
        if (!tvls[f.lpAddress]) {
          return f
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const tvl = tvls[f.lpAddress]!
        // Mock 1$ tvl if the farm doesn't have lp staked
        if (mockApr && tvl?.token0 === '0' && tvl?.token1 === '0') {
          const [token0Price, token1Price] = f.token.sortsBefore(f.quoteToken)
            ? [f.tokenPriceBusd, f.quoteTokenPriceBusd]
            : [f.quoteTokenPriceBusd, f.tokenPriceBusd]
          tvl.token0 = token0Price ? String(1 / Number(token0Price)) : '1'
          tvl.token1 = token1Price ? String(1 / Number(token1Price)) : '1'
        }
        const { activeTvlUSD, activeTvlUSDUpdatedAt, wayaApr } = farmFetcherExtended.getWayaAprAndTVL(
          f,
          tvl,
          wayaPrice.toString(),
          farmExtended.data.wayaPerSecond,
        )

        return {
          ...f,
          wayaApr,
          activeTvlUSD,
          activeTvlUSDUpdatedAt,
        }
      })

      return {
        ...farmExtended.data,
        farmsWithPrice: farmWithPriceAndWayaAPR,
      }
    },

    enabled: Boolean(farmExtended.data.farmsWithPrice.length > 0),
    refetchInterval: FAST_INTERVAL * 3,
    staleTime: FAST_INTERVAL,
  })

  return {
    data: useMemo(() => {
      return farmExtended.isLoading || farmExtended.data.chainId !== chainId
        ? (farmExtended.data as FarmsExtendedResponse<FarmExtendedDataWithPriceTVL>)
        : ((data?.chainId !== chainId ? farmExtended.data : data ?? farmExtended.data) as FarmsExtendedResponse<FarmExtendedDataWithPriceTVL>)
    }, [chainId, data, farmExtended.data, farmExtended.isLoading]),
    isLoading: farmExtended.isLoading,
    error: farmExtended.error,
  }
}

export const useStakedPositionsByUser = (stakedTokenIds: bigint[]) => {
  const { address: account } = useAccount()
  const { chainId } = useActiveChainId()
  const chieffarmerExtended = useChieffarmerExtended()

  const harvestCalls = useMemo(() => {
    if (!chieffarmerExtended?.abi || !account || !extendedFarmSupportedChainId.includes(chainId ?? -1)) return []
    const callData: Hex[] = []
    for (const stakedTokenId of stakedTokenIds) {
        callData.push(
          encodeFunctionData({
            abi: chieffarmerExtended?.abi ?? [],
            functionName: 'harvest',
            args: [stakedTokenId, account],
          }),
        )
    }
    return callData
  }, [account, chieffarmerExtended?.abi, stakedTokenIds, chainId])

  const { data } = useQuery<bigint[]>({
    queryKey: ['chieffarmerextended-harvest', ...harvestCalls],

    queryFn: () => {
      if (!chieffarmerExtended || !harvestCalls.length) return []

      return chieffarmerExtended?.simulate.multicall([harvestCalls], { account, value: 0n }).then((res) => {
        return res.result
          .map((r) =>
            decodeFunctionResult({
              abi: chieffarmerExtended?.abi,
              functionName: 'harvest',
              data: r,
            }),
          )
          .map((r) => {
            return r
          })
      })
    },

    enabled: Boolean(account),
    placeholderData: keepPreviousData,
  })

  return { tokenIdResults: data || [], isLoading: harvestCalls.length > 0 && !data }
}

const usePositionsByUserFarms = (
  farmsExtended: FarmExtendedDataWithPrice[],
): {
  farmsWithPositions: FarmExtendedDataWithPriceAndUserInfo[]
  userDataLoaded: boolean
} => {
  const { address: account } = useAccount()
  const positionManager = useExtendedNFTPositionManagerContract()
  const chieffarmerExtended = useChieffarmerExtended()

  const { tokenIds: stakedTokenIds } = useExtendedTokenIdsByAccount(chieffarmerExtended?.address, account)

  const stakedIds = useMemo(() => stakedTokenIds || [], [stakedTokenIds])

  const { tokenIds } = useExtendedTokenIdsByAccount(positionManager?.address, account)

  const uniqueTokenIds = useMemo(() => [...stakedIds, ...tokenIds], [stakedIds, tokenIds])

  const { positions } = useExtendedPositionsFromTokenIds(uniqueTokenIds)

  const { tokenIdResults, isLoading: isStakedPositionLoading } = useStakedPositionsByUser(stakedIds)

  const [unstakedPositions, stakedPositions] = useMemo(() => {
    if (!positions) return [[], []]
    const unstakedIds = tokenIds.filter((id) => !stakedIds.find((s) => s === id))
    return [
      unstakedIds
        .map((id) => positions.find((p) => p.tokenId === id))
        .filter((p) => (p?.liquidity ?? 0n) > 0n) as PositionDetails[],
      stakedIds
        .map((id) => positions.find((p) => p.tokenId === id))
        .filter((p) => (p?.liquidity ?? 0n) > 0n) as PositionDetails[],
    ]
  }, [positions, stakedIds, tokenIds])

  const pendingWayaByTokenIds = useMemo(
    () =>
      (tokenIdResults as bigint[])?.reduce<IPendingWayaByTokenId>((acc, pendingWaya, i) => {
        const position = stakedPositions[i]

        return pendingWaya && position?.tokenId ? { ...acc, [position.tokenId.toString()]: pendingWaya } : acc
      }, {} as IPendingWayaByTokenId) ?? {},
    [stakedPositions, tokenIdResults],
  )

  // assume that if any of the tokenIds have a valid result, the data is ready
  const userDataLoaded = !isStakedPositionLoading

  const farmsWithPositions = useMemo(
    () =>
      farmsExtended.map((farm) => {
        const { feeAmount, token0, token1 } = farm

        const unstaked = unstakedPositions.filter(
          (p) =>
            toLower(p?.token0) === toLower(token0.address) &&
            toLower(p?.token1) === toLower(token1.address) &&
            feeAmount === p?.fee,
        )
        const staked = stakedPositions.filter((p) => {
          return (
            toLower(p?.token0) === toLower(token0.address) &&
            toLower(p?.token1) === toLower(token1.address) &&
            feeAmount === p?.fee
          )
        })

        return {
          ...farm,
          unstakedPositions: unstaked,
          stakedPositions: staked,
          pendingWayaByTokenIds: Object.entries(pendingWayaByTokenIds).reduce<IPendingWayaByTokenId>(
            (acc, [tokenId, waya]) => {
              const foundPosition = staked.find((p) => p?.tokenId === BigInt(tokenId))

              if (foundPosition) {
                return { ...acc, [tokenId]: waya }
              }

              return acc
            },
            {},
          ),
        }
      }),
    [farmsExtended, pendingWayaByTokenIds, stakedPositions, unstakedPositions],
  )

  return {
    farmsWithPositions,
    userDataLoaded,
  }
}

export function useFarmsExtendedWithPositionsAndBooster(options: UseFarmsOptions = {}): {
  farmsWithPositions: FarmExtendedDataWithPriceAndUserInfo[]
  userDataLoaded: boolean
  wayaPerSecond: string
  poolLength: number
  isLoading: boolean
} {
  const { data, error: _error, isLoading } = useFarmsExtended(options)
  const { data: boosterWhitelist } = useExtendedBoostedFarm(data?.farmsWithPrice?.map((f) => f.pid))
  const { data: boosterliquidityX } = useExtendedBoostedLiquidityX(data?.farmsWithPrice?.map((f) => f.pid))

  return {
    ...usePositionsByUserFarms(
      data.farmsWithPrice?.map((d, index) => ({
        ...d,
        boosted: boosterWhitelist?.[index]?.boosted,
        boosterliquidityX: boosterliquidityX?.[index]?.boosterliquidityX,
      })),
    ),
    poolLength: data.poolLength,
    wayaPerSecond: data.wayaPerSecond,
    isLoading,
  }
}

const useExtendedBoostedFarm = (pids?: number[]) => {
  const { chainId } = useActiveChainId()
  const farmBoosterVoterContract = useFarmBoosterVoterContract()

  const { data } = useQuery({
    queryKey: ['extended/boostedFarm', chainId, pids?.join('-')],

    queryFn: () =>
      getExtendedFarmBoosterWhiteList({
        farmBoosterContract: farmBoosterVoterContract,
        chainId: chainId ?? -1,
        pids: pids ?? [],
      }),

    enabled: Boolean(chainId && pids && pids.length > 0 && wayaSupportedChainId.includes(chainId)),
    retry: 3,
    retryDelay: 3000,
  })
  return { data }
}

const useExtendedBoostedLiquidityX = (pids?: number[]) => {
  const { chainId } = useActiveChainId()
  const chiefFarmerExtendedContract = useChieffarmerExtended()

  const { data } = useQuery({
    queryKey: ['extended/getExtendedBoosterAPRLiquidityX', chainId, pids?.join('-')],

    queryFn: () =>
      getExtendedBoosterAPRLiquidityX({
        chiefFarmerExtendedContract,
        chainId: chainId ?? -1,
        pids: pids ?? [],
      }),

    enabled: Boolean(chainId && pids && pids.length > 0 && wayaSupportedChainId.includes(chainId)),
    retry: 3,
    retryDelay: 3000,
  })
  return { data }
}

export async function getExtendedFarmBoosterWhiteList({
  farmBoosterContract,
  chainId,
  pids,
}: {
  farmBoosterContract: ReturnType<typeof useFarmBoosterVoterContract>
  chainId: ChainId
  pids: number[]
}): Promise<{ pid: number; boosted: boolean }[]> {
  const contracts = pids?.map((pid) => {
    return {
      address: farmBoosterContract.address,
      functionName: 'whiteList',
      abi: farmBoosterVoterABI,
      args: [BigInt(pid)],
    } as const
  })
  const whiteList = await publicClient({ chainId }).multicall({
    contracts,
  })

  if (!whiteList || whiteList?.length !== pids?.length) return []
  return pids?.map((d, index) => ({ pid: d, boosted: whiteList[index].result ?? false }))
}

export async function getExtendedBoosterAPRLiquidityX({
  chiefFarmerExtendedContract,
  chainId,
  pids,
}: {
  chiefFarmerExtendedContract: ReturnType<typeof useChieffarmerExtended>
  chainId: ChainId
  pids: number[]
}): Promise<{ pid: number; boosterliquidityX: number }[]> {
  const contracts = pids?.map((pid) => {
    return {
      address: chiefFarmerExtendedContract?.address ?? '0x',
      functionName: 'poolInfo',
      abi: chiefFarmerExtendedABI,
      args: [BigInt(pid)],
    } as const
  })
  const data = await publicClient({ chainId }).multicall({
    contracts,
  })

  if (!data || data?.length !== pids?.length) return []

  return pids?.map((d, index) => ({
    pid: d,
    boosterliquidityX:
      new BN(data?.[index]?.result?.[6]?.toString() ?? 1).div(data?.[index]?.result?.[5]?.toString() ?? 1).toNumber() ??
      1,
  }))
}

