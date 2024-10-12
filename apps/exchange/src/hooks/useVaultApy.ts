import { ChainId } from '@plexswap/chains'
import { BOOST_WEIGHT, DURATION_FACTOR, MAX_LOCK_DURATION } from '@plexswap/pools'
import { BIG_ZERO } from '@plexswap/utils/bigNumber'
import { useQuery } from '@tanstack/react-query'
import BN from 'bignumber.js'
import { BLOCKS_PER_YEAR } from 'config'
import { chiefFarmerABI } from 'config/abi/ChiefFarmer'
import toString from 'lodash/toString'
import { useCallback, useMemo } from 'react'
import { useWayaVault } from 'state/pools/hooks'
import { getChiefFarmerAddress } from 'utils/addressHelpers'
import { publicClient } from 'utils/wagmi'

const chiefFarmerAddress = getChiefFarmerAddress(ChainId.BSC)!

// default
const DEFAULT_PERFORMANCE_FEE_DECIMALS = 2

const PRECISION_FACTOR = new BN('1000000000000')
const WeiPerEther = new BN('1000000000000000000')

const getFlexibleApy = (totalWayaPoolEmissionPerYear: BN, pricePerFullShare: BN, totalShares: BN) =>
  totalWayaPoolEmissionPerYear.times(WeiPerEther).div(pricePerFullShare).div(totalShares).times(100)

const _getBoostFactor = (boostWeight: bigint, duration: number, durationFactor: bigint) => {
  return new BN(boostWeight.toString())
    .times(new BN(Math.max(duration, 0)))
    .div(new BN(durationFactor.toString()))
    .div(PRECISION_FACTOR)
}

const getLockedApy = (flexibleApy: string, boostFactor: BN) => new BN(flexibleApy).times(boostFactor.plus(1))

const wayaPoolPID = 0

export function useVaultApy({ duration = MAX_LOCK_DURATION }: { duration?: number } = {}) {
  const {
    totalShares = BIG_ZERO,
    pricePerFullShare = BIG_ZERO,
    fees: { performanceFeeAsDecimal } = { performanceFeeAsDecimal: DEFAULT_PERFORMANCE_FEE_DECIMALS },
  } = useWayaVault()

  const totalSharesAsEtherBN = useMemo(() => new BN(totalShares.toString()), [totalShares])
  const pricePerFullShareAsEtherBN = useMemo(() => new BN(pricePerFullShare.toString()), [pricePerFullShare])

  const { data: totalWayaPoolEmissionPerYear } = useQuery({
    queryKey: ['chiefFarmer-total-waya-pool-emission'],
    queryFn: async () => {
      const bscClient = publicClient({ chainId: ChainId.BSC })

      const [specialFarmsPerBlock, wayaPoolInfo, totalSpecialAllocPoint] = await bscClient.multicall({
        contracts: [
          {
            address: chiefFarmerAddress,
            abi: chiefFarmerABI,
            functionName: 'wayaPerBlock',
            args: [false],
          },
          {
            address: chiefFarmerAddress,
            abi: chiefFarmerABI,
            functionName: 'poolInfo',
            args: [BigInt(wayaPoolPID)],
          },
          {
            address: chiefFarmerAddress,
            abi: chiefFarmerABI,
            functionName: 'totalSpecialAllocPoint',
          },
        ],
        allowFailure: false,
      })

      const allocPoint = wayaPoolInfo[2]

      const wayaPoolSharesInSpecialFarms = new BN(allocPoint.toString()).div(new BN(totalSpecialAllocPoint.toString()))
      return new BN(specialFarmsPerBlock.toString()).times(BLOCKS_PER_YEAR).times(wayaPoolSharesInSpecialFarms)
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  const flexibleApy = useMemo(
    () =>
      totalWayaPoolEmissionPerYear &&
      !pricePerFullShareAsEtherBN.isZero() &&
      !totalSharesAsEtherBN.isZero() &&
      getFlexibleApy(totalWayaPoolEmissionPerYear, pricePerFullShareAsEtherBN, totalSharesAsEtherBN).toString(),
    [pricePerFullShareAsEtherBN, totalWayaPoolEmissionPerYear, totalSharesAsEtherBN],
  )

  const boostFactor = useMemo(() => _getBoostFactor(BOOST_WEIGHT, duration, DURATION_FACTOR), [duration])

  const lockedApy = useMemo(() => {
    return flexibleApy ? getLockedApy(flexibleApy, boostFactor).toString() : '0'
  }, [boostFactor, flexibleApy])

  const getBoostFactor = useCallback(
    (adjustDuration: number) => _getBoostFactor(BOOST_WEIGHT, adjustDuration, DURATION_FACTOR),
    [],
  )

  const flexibleApyNoFee = useMemo(() => {
    if (flexibleApy && performanceFeeAsDecimal) {
      const rewardPercentageNoFee = toString(1 - performanceFeeAsDecimal / 100)

      return new BN(flexibleApy).times(rewardPercentageNoFee).toString()
    }

    return flexibleApy
  }, [flexibleApy, performanceFeeAsDecimal])

  return {
    flexibleApy: flexibleApyNoFee,
    lockedApy,
    getLockedApy: useCallback(
      (adjustDuration: number) => flexibleApy && getLockedApy(flexibleApy, getBoostFactor(adjustDuration)).toString(),
      [flexibleApy, getBoostFactor],
    ),
    boostFactor: useMemo(() => boostFactor.plus('1'), [boostFactor]),
    getBoostFactor: useCallback((adjustDuration: number) => getBoostFactor(adjustDuration).plus('1'), [getBoostFactor]),
  }
}