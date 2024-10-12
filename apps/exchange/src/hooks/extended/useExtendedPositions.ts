import { PositionDetails } from '@plexswap/farms'
import { chiefFarmerExtendedABI } from '@plexswap/sdk-extended'
import { useReadContract, useReadContracts } from '@plexswap/wagmi'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useExtendedNFTPositionManagerContract, useChieffarmerExtended } from 'hooks/useContract'
import { useEffect, useMemo } from 'react'
import { Address } from 'viem'

interface UseExtendedPositionsResults {
  loading: boolean
  positions: PositionDetails[] | undefined
}

interface UseExtendedPositionResults {
  loading: boolean
  position: PositionDetails | undefined
}

export function useExtendedPositionsFromTokenIds(tokenIds: bigint[] | undefined): UseExtendedPositionsResults {
  const positionManager = useExtendedNFTPositionManagerContract()
  const { chainId } = useActiveChainId()

  const inputs = useMemo(
    () =>
      tokenIds && positionManager
        ? tokenIds.map(
            (tokenId) =>
              ({
                abi: positionManager.abi,
                address: positionManager.address,
                functionName: 'positions',
                args: [tokenId],
                chainId,
              } as const),
          )
        : [],
    [chainId, positionManager, tokenIds],
  )

  const { isLoading, data: positions = [] } = useReadContracts({
    contracts: inputs,
    allowFailure: true,
    query: {
      enabled: !!inputs.length,
    },
    watch: true,
  })

  return {
    loading: isLoading,
    positions: useMemo(
      () =>
        positions
          .filter((p) => p.status === 'success')
          .map((p) => {
            const r = p.result!
            return {
              nonce: r[0],
              operator: r[1],
              token0: r[2],
              token1: r[3],
              fee: r[4],
              tickLower: r[5],
              tickUpper: r[6],
              liquidity: r[7],
              feeGrowthInside0LastX128: r[8],
              feeGrowthInside1LastX128: r[9],
              tokensOwed0: r[10],
              tokensOwed1: r[11],
            } as Omit<PositionDetails, 'tokenId'>
          })
          .map((position, i) =>
            position && typeof inputs?.[i]?.args[0] !== 'undefined'
              ? {
                  ...position,
                  tokenId: inputs?.[i]?.args[0],
                }
              : null,
          )
          // filter boolean assert
          .filter(Boolean) as PositionDetails[],
      [inputs, positions],
    ),
  }
}

export function useExtendedPositionFromTokenId(tokenId: bigint | undefined): UseExtendedPositionResults {
  const position = useExtendedPositionsFromTokenIds(tokenId ? [tokenId] : undefined)

  return useMemo(
    () => ({
      loading: position.loading,
      position: position.positions?.[0],
    }),
    [position.loading, position.positions],
  )
}

export function useExtendedTokenIdsByAccount(
  contractAddress?: Address,
  account?: Address | null | undefined,
): { tokenIds: bigint[]; loading: boolean } {
  const { chainId } = useActiveChainId()

  const {
    isLoading: balanceLoading,
    data: accountBalance,
    refetch: refetchBalance,
  } = useReadContract({
    abi: chiefFarmerExtendedABI,
    address: contractAddress as `0x${string}`,
    query: {
      enabled: !!account && !!contractAddress,
    },
    args: [account!],
    functionName: 'balanceOf',
    chainId,
    watch: true,
  })

  const tokenIdsArgs = useMemo(() => {
    if (accountBalance && account) {
      const tokenRequests: {
        abi: typeof chiefFarmerExtendedABI
        address: Address
        functionName: 'tokenOfOwnerByIndex'
        args: [Address, number]
        chainId?: number
      }[] = []
      for (let i = 0; i < accountBalance; i++) {
        tokenRequests.push({
          abi: chiefFarmerExtendedABI,
          address: contractAddress as `0x${string}`,
          functionName: 'tokenOfOwnerByIndex',
          args: [account, i],
          chainId,
        })
      }
      return tokenRequests
    }
    return []
  }, [account, accountBalance, chainId, contractAddress])

  const {
    isLoading: someTokenIdsLoading,
    data: tokenIds = [],
    refetch: refetchTokenIds,
  } = useReadContracts({
    contracts: tokenIdsArgs,
    allowFailure: true,
    query: {
      enabled: !!tokenIdsArgs.length,
    },
  })

  // refetch when account changes, It seems like the useReadContracts doesn't refetch when the account changes on production
  // check if we can remove this effect when we upgrade to the latest version of wagmi
  useEffect(() => {
    if (account) {
      refetchBalance()
      refetchTokenIds()
    }
  }, [account, refetchBalance, refetchTokenIds])

  return {
    tokenIds: useMemo(
      () => tokenIds.map((r) => (r.status === 'success' ? r.result : null)).filter(Boolean) as bigint[],
      [tokenIds],
    ),
    loading: someTokenIdsLoading || balanceLoading,
  }
}

export function useExtendedPositions(account: Address | null | undefined): UseExtendedPositionsResults {
  const positionManager = useExtendedNFTPositionManagerContract()
  const chieffarmerExtended = useChieffarmerExtended()

  const { tokenIds, loading: tokenIdsLoading } = useExtendedTokenIdsByAccount(positionManager?.address, account)

  const { tokenIds: stakedTokenIds } = useExtendedTokenIdsByAccount(chieffarmerExtended?.address, account)

  const totalTokenIds = useMemo(() => [...stakedTokenIds, ...tokenIds], [stakedTokenIds, tokenIds])

  const { positions, loading: positionsLoading } = useExtendedPositionsFromTokenIds(totalTokenIds)

  return useMemo(
    () => ({
      loading: tokenIdsLoading || positionsLoading,
      positions: positions?.map((position) => ({
        ...position,
        isStaked: Boolean(stakedTokenIds?.find((s) => s === position.tokenId)),
      })),
    }),
    [positions, positionsLoading, stakedTokenIds, tokenIdsLoading],
  )
}
