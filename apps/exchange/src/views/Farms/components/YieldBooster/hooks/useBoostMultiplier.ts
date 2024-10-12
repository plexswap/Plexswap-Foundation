import { ChainId } from '@plexswap/chains'
import { ZERO } from '@plexswap/sdk-core'
import { useQuery } from '@tanstack/react-query'
import BN from 'bignumber.js'
import { farmBoosterABI } from 'config/abi/FarmBooster'
import { useChieffarmer, useFarmBoosterContract } from 'hooks/useContract'
import _toNumber from 'lodash/toNumber'
import { useCallback } from 'react'
import { publicClient } from 'utils/wagmi'
import { Address } from 'viem'
import { useAccount } from 'wagmi'
import { YieldBoosterState } from './useYieldBoosterState'

const PRECISION_FACTOR = new BN('1000000000000') // 1e12

async function getPublicMultiplier({ farmBoosterContract }): Promise<number> {
  const [lMaxBoostResult, caPrecisionResult, boostPrecisionResult] = await publicClient({ chainId: ChainId.BSC }).multicall({
    contracts: [
      {
        address: farmBoosterContract.address,
        abi: farmBoosterABI,
        functionName: 'lMaxBoost',
      },
      {
        address: farmBoosterContract.address,
        abi: farmBoosterABI,
        functionName: 'LMB_PRECISION',
      },
      {
        address: farmBoosterContract.address,
        abi: farmBoosterABI,
        functionName: 'BOOST_PRECISION',
      },
    ],
    allowFailure: true,
  })

  if (!lMaxBoostResult.result || !caPrecisionResult.result || !boostPrecisionResult) return 0

  const [lMaxBoost, LMB_PRECISION, BOOST_PRECISION] = [lMaxBoostResult.result, caPrecisionResult.result, boostPrecisionResult.result]

  const MAX_BOOST_PRECISION = new BN(LMB_PRECISION.toString())
    .div(new BN(lMaxBoost.toString()))
    .times(PRECISION_FACTOR)
    .minus(new BN(BOOST_PRECISION?.toString() ?? ZERO.toString()))

  const boostPercent = PRECISION_FACTOR.plus(MAX_BOOST_PRECISION).div(PRECISION_FACTOR)

  return _toNumber(boostPercent.toFixed(3).toString())
}

async function getUserMultiplier({ farmBoosterContract, account, pid }): Promise<number> {
  const [multiplierResult, boostPrecisionResult] = await publicClient({ chainId: ChainId.BSC }).multicall({
    contracts: [
      {
        address: farmBoosterContract.address,
        abi: farmBoosterABI,
        functionName: 'getUserMultiplier',
        args: [account, BigInt(pid)],
      },
      {
        address: farmBoosterContract.address,
        abi: farmBoosterABI,
        functionName: 'BOOST_PRECISION',
      },
    ],
    allowFailure: true,
  })

  if (!multiplierResult.result || !boostPrecisionResult.result) return 0

  const [multiplier, BOOST_PRECISION] = [multiplierResult.result, boostPrecisionResult.result]

  return _toNumber(
    PRECISION_FACTOR.plus(new BN(multiplier.toString()))
      .minus(new BN(BOOST_PRECISION.toString()))
      .div(PRECISION_FACTOR)
      .toFixed(3)
      .toString(),
  )
}

async function getMultiplierFromMC({
  pid,
  proxyAddress,
  chiefFarmerContract,
}: {
  pid: number
  proxyAddress: Address
  chiefFarmerContract: ReturnType<typeof useChieffarmer>
}): Promise<number> {
  const boostMultiplier = await chiefFarmerContract?.read.getBoostMultiplier([proxyAddress, BigInt(pid)])

  if (!boostMultiplier) return 0

  return _toNumber(new BN(boostMultiplier.toString()).div(PRECISION_FACTOR).toFixed(3).toString())
}

export default function useBoostMultiplier({ pid, boosterState, proxyAddress }): number {
  const farmBoosterContract = useFarmBoosterContract()
  const chiefFarmerContract = useChieffarmer()

  const { address: account } = useAccount()

  const shouldGetFromSC = [YieldBoosterState.DEACTIVE, YieldBoosterState.ACTIVE, YieldBoosterState.MAX].includes(
    boosterState,
  )
  const should1X = [YieldBoosterState.LOCKED_END].includes(boosterState)

  const getMultiplier = useCallback(async () => {
    if (shouldGetFromSC) {
      return getMultiplierFromMC({ pid, chiefFarmerContract, proxyAddress })
    }

    return should1X
      ? getUserMultiplier({ farmBoosterContract, pid, account })
      : getPublicMultiplier({
          farmBoosterContract,
        })
  }, [farmBoosterContract, chiefFarmerContract, should1X, shouldGetFromSC, pid, account, proxyAddress])

  const cacheName = shouldGetFromSC ? `proxy${pid}` : should1X ? `user${pid}` : `public${pid}`

  const { data } = useQuery({
    queryKey: ['boostMultiplier', cacheName],
    queryFn: getMultiplier,
  })

  return data || 0
}