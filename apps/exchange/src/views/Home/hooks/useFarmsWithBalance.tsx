import { getFarmConfig } from '@plexswap/farms/config'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { verifyBscNetwork } from '@plexswap/chains'
import { getBalanceNumber } from '@plexswap/utils/formatBalance'
import { useQuery } from '@tanstack/react-query'
import BigNumber from 'bignumber.js'
import { DEFAULT_TOKEN_DECIMAL } from 'config'
import { chiefFarmerABI } from 'config/abi/ChiefFarmer'
import { wayaWrapperABI } from 'config/abi/WayaWrapper'
import { FAST_INTERVAL } from 'config/constants'
import { SerializedFarmConfig, SerializedFarmPublicData } from '@plexswap/farms'
import { useExtendedTokenIdsByAccount } from 'hooks/extended/useExtendedPositions'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useChieffarmer, useChieffarmerExtended, useFarmBoosterProxyContract, useWaya } from 'hooks/useContract'
import { useCallback, useMemo } from 'react'
import { useFarmsLength } from 'state/farms/hooks'
import { useStakedPositionsByUser } from 'state/farmsExtended/hooks'
import { getSpecialWayaWrapperContract } from 'utils/contractHelpers'
import { publicClient } from 'utils/wagmi'
import { useWalletClient } from 'wagmi'
import splitProxyFarms from '../../Farms/components/YieldBooster/helpers/splitProxyFarms'
import { useFarmBoosterProxyContractAddress } from '../../../hooks/useFarmBoosterProxyContractAddress'

export type FarmWithBalance = {
  balance: BigNumber
  contract: any
  wayaBalance: BigNumber
  wayaContract: any | undefined
} & SerializedFarmConfig

const useFarmsWithBalance = () => {
  const { account, chainId } = useAccountActiveChain()
  const { data: poolLength } = useFarmsLength()
  const { proxyAddress, isLoading: isProxyContractAddressLoading } = useFarmBoosterProxyContractAddress(account, chainId)
  const farmBoosterProxy = useFarmBoosterProxyContract(proxyAddress)
  const chiefFarmerContract = useChieffarmer()
  const waya = useWaya()

  const chieffarmerExtended = useChieffarmerExtended()
  const { tokenIds: stakedTokenIds } = useExtendedTokenIdsByAccount(chieffarmerExtended?.address, account)

  const { tokenIdResults: extendedPendingWayas } = useStakedPositionsByUser(stakedTokenIds)

  const { data: signer } = useWalletClient()

  const getFarmsWithBalances = useCallback(
    async (farms: SerializedFarmPublicData[], accountToCheck: string, contract) => {
      const isUserAccount = accountToCheck.toLowerCase() === account?.toLowerCase()

      const result = chiefFarmerContract
        ? await publicClient({ chainId }).multicall({
            contracts: farms.map((farm) => ({
              abi: chiefFarmerABI,
              address: chiefFarmerContract.address,
              functionName: 'pendingWaya',
              args: [farm.pid, accountToCheck],
            })),
          })
        : undefined

      const wayaResult = isUserAccount
        ? await publicClient({ chainId }).multicall({
            contracts: farms
              .filter((farm) => Boolean(farm?.wayaWrapperAddress))
              .map((farm) => {
                return {
                  abi: wayaWrapperABI,
                  address: farm?.wayaWrapperAddress ?? '0x',
                  functionName: 'pendingReward',
                  args: [accountToCheck] as const,
                } as const
              }),
          })
        : []

      let wayaIndex = 0

      const proxyWayaBalance =
        chiefFarmerContract && contract.address !== chiefFarmerContract.address && farmBoosterProxy && waya
          ? await waya.read.balanceOf([farmBoosterProxy.address])
          : null

      const proxyWayaBalanceNumber = proxyWayaBalance ? getBalanceNumber(new BigNumber(proxyWayaBalance.toString())) : 0
      const results = farms.map((farm, index) => {
        let wayaBalance = BIG_ZERO
        if (isUserAccount && farm?.wayaWrapperAddress) {
          wayaBalance = new BigNumber(((wayaResult[wayaIndex].result as bigint) ?? '0').toString())
          wayaIndex++
        }
        return {
          ...farm,
          balance: result ? new BigNumber((result[index].result as bigint).toString()) : BIG_ZERO,
          wayaBalance,
        }
      })
      const farmsWithBalances: FarmWithBalance[] = results
        .filter((balanceType) => balanceType.balance.gt(0) || balanceType.wayaBalance.gt(0))
        .map((farm) => ({
          ...farm,
          contract,
          wayaContract:
            isUserAccount && farm.wayaWrapperAddress
              ? getSpecialWayaWrapperContract(farm.wayaWrapperAddress, signer ?? undefined, chainId)
              : undefined,
        }))
      const totalEarned = farmsWithBalances.reduce((accum, earning) => {
        const earningNumber = new BigNumber(earning.balance)
        const earningWayaNumber = new BigNumber(earning.wayaBalance)
        if (earningNumber.eq(0) && earningWayaNumber.eq(0)) {
          return accum
        }
        return (
          accum +
          earningNumber.div(DEFAULT_TOKEN_DECIMAL).toNumber() +
          earningWayaNumber.div(DEFAULT_TOKEN_DECIMAL).toNumber()
        )
      }, 0)
      return { farmsWithBalances, totalEarned: totalEarned + proxyWayaBalanceNumber }
    },
    [farmBoosterProxy, waya, chainId, chiefFarmerContract, account, signer],
  )

  const {
    data: { farmsWithStakedBalance, earningsSum } = {
      farmsWithStakedBalance: [] as FarmWithBalance[],
      earningsSum: null,
    },
  } = useQuery({
    queryKey: [account, 'farmsWithBalance', chainId, poolLength],

    queryFn: async () => {
      if (!account || !poolLength || !chainId) return undefined
      const farmsConfig = await getFarmConfig(chainId)
      const farmsCanFetch = farmsConfig?.filter((f) => poolLength > f.pid)
      const normalBalances = await getFarmsWithBalances(farmsCanFetch ?? [], account, chiefFarmerContract)
      if (proxyAddress && farmsCanFetch?.length && verifyBscNetwork(chainId)) {
        const { farmsWithProxy } = splitProxyFarms(farmsCanFetch)

        const proxyBalances = await getFarmsWithBalances(farmsWithProxy, proxyAddress, farmBoosterProxy)
        return {
          farmsWithStakedBalance: [...normalBalances.farmsWithBalances, ...proxyBalances.farmsWithBalances],
          earningsSum: normalBalances.totalEarned + proxyBalances.totalEarned,
        }
      }
      return {
        farmsWithStakedBalance: normalBalances.farmsWithBalances,
        earningsSum: normalBalances.totalEarned,
      }
    },

    enabled: Boolean(account && poolLength && chainId && !isProxyContractAddressLoading),
    refetchInterval: FAST_INTERVAL,
  })

  const extendedFarmsWithBalance = useMemo(
    () =>
      stakedTokenIds
        .map((tokenId, i) => {
          if (extendedPendingWayas?.[i] > 0n) {
            return {
              sendTx: {
                tokenId: tokenId.toString(),
                to: account,
              },
            }
          }
          return null
        })
        .filter(Boolean),
    [stakedTokenIds, extendedPendingWayas, account],
  )

  return useMemo(() => {
    return {
      farmsWithStakedBalance: [...farmsWithStakedBalance, ...extendedFarmsWithBalance],
      earningsSum:
        (earningsSum ?? 0) +
          extendedPendingWayas?.reduce((accum, earning) => {
            const earningNumber = new BigNumber(earning.toString())
            if (earningNumber.eq(0)) {
              return accum
            }
            return accum + earningNumber.div(DEFAULT_TOKEN_DECIMAL).toNumber()
          }, 0) ?? 0,
    }
  }, [earningsSum, farmsWithStakedBalance, extendedFarmsWithBalance, extendedPendingWayas])
}

export default useFarmsWithBalance